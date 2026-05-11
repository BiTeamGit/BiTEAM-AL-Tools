import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const EASY_ADDONS_PATTERN = /^easyAddons(_BC\d+)?$/i;

export async function updateBcVersion(workspaceRoot: string): Promise<void> {
  // Step 1: BC version
  const input = await vscode.window.showInputBox({
    prompt: vscode.l10n.t('Enter BC major version (e.g. 28)'),
    placeHolder: '28',
    validateInput: v => /^\d+$/.test(v) ? null : vscode.l10n.t('Please enter a whole number')
  });
  if (input === undefined) {
    return;
  }

  const bcVersion = parseInt(input, 10);
  const versionStr = String(bcVersion);

  // Step 2: Git root (needed to check cosmo.json before asking further questions)
  let repoRoot: string;
  try {
    repoRoot = execSync('git rev-parse --show-toplevel', { cwd: workspaceRoot }).toString().trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(vscode.l10n.t('BIT: Cannot determine git root — {0}', msg));
    return;
  }

  // Step 3: Check cosmo.json for easyAddons entries — only ask if relevant
  let easyAddonsFeed: string | undefined;
  const cosmoPath = path.join(repoRoot, '.devops', 'cosmo.json');
  let cosmoObj: Record<string, unknown> | undefined;

  if (fs.existsSync(cosmoPath)) {
    cosmoObj = JSON.parse(fs.readFileSync(cosmoPath, 'utf8'));
    const hasEasyAddons =
      Array.isArray((cosmoObj as Record<string, unknown>).devopsArtifacts) &&
      ((cosmoObj as { devopsArtifacts: { feed: string }[] }).devopsArtifacts)
        .some(a => typeof a.feed === 'string' && EASY_ADDONS_PATTERN.test(a.feed));

    if (hasEasyAddons) {
      const latestLabel = vscode.l10n.t('Yes — use "easyAddons" (no version suffix)');
      const olderLabel  = vscode.l10n.t('No — use "easyAddons_BC{0}"', versionStr);
      const pick = await vscode.window.showQuickPick(
        [latestLabel, olderLabel],
        { placeHolder: vscode.l10n.t('Is BC {0} the current/latest released version?', versionStr) }
      );
      if (pick === undefined) {
        return;
      }
      easyAddonsFeed = pick === latestLabel ? 'easyAddons' : `easyAddons_BC${versionStr}`;
    }
  }

  // Step 4: Branch
  const branchName = `Feature/BC${versionStr}Update`;
  try {
    const existingBranches = execSync('git branch --list', { cwd: repoRoot }).toString();
    const branchExists = existingBranches.split('\n').some(b => b.replace(/^\*?\s+/, '') === branchName);
    if (branchExists) {
      execSync(`git checkout "${branchName}"`, { cwd: repoRoot });
    } else {
      execSync(`git checkout -b "${branchName}"`, { cwd: repoRoot });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(vscode.l10n.t('BIT: Cannot create branch "{0}" — {1}', branchName, msg));
    return;
  }

  const updated: string[] = [];
  const skipped: string[] = [];

  // .devops/cosmo.json
  if (cosmoObj !== undefined) {
    let cosmoChanged = false;
    const obj = cosmoObj as Record<string, unknown>;

    if ((obj.bcArtifacts as Record<string, unknown>)?.current !== undefined) {
      ((obj.bcArtifacts as Record<string, unknown>).current as Record<string, unknown>).version = versionStr;
      cosmoChanged = true;
    } else {
      vscode.window.showWarningMessage(
        vscode.l10n.t('BIT: .devops/cosmo.json found but bcArtifacts.current is missing.')
      );
    }

    if (easyAddonsFeed !== undefined && Array.isArray(obj.devopsArtifacts)) {
      for (const artifact of obj.devopsArtifacts as { feed: string }[]) {
        if (typeof artifact.feed === 'string' && EASY_ADDONS_PATTERN.test(artifact.feed)) {
          artifact.feed = easyAddonsFeed;
          cosmoChanged = true;
        }
      }
    }

    if (cosmoChanged) {
      fs.writeFileSync(cosmoPath, JSON.stringify(obj, null, 2), 'utf8');
      updated.push('.devops/cosmo.json');
    }
  } else {
    skipped.push('.devops/cosmo.json');
  }

  // .devops/azure-pipeline.yml
  const pipelinePath = path.join(repoRoot, '.devops', 'azure-pipeline.yml');
  if (fs.existsSync(pipelinePath)) {
    let content = fs.readFileSync(pipelinePath, 'utf8');
    const before = content;
    content = content.replace(
      /(-\s+name:\s*["']?Version\.Major["']?\s*\r?\n\s*value:\s*["']?)\d+(["']?)/,
      `$1${versionStr}$2`
    );
    if (content !== before) {
      fs.writeFileSync(pipelinePath, content, 'utf8');
      updated.push('.devops/azure-pipeline.yml');
    } else {
      vscode.window.showWarningMessage(
        vscode.l10n.t('BIT: .devops/azure-pipeline.yml found but Version.Major could not be replaced — check structure.')
      );
    }
  } else {
    skipped.push('.devops/azure-pipeline.yml');
  }

  // app/app.json und test/app.json
  const appVersion = `${bcVersion}.0.0.0`;
  const runtime = `${bcVersion - 11}.0`;
  for (const subfolder of ['app', 'test']) {
    const jsonPath = path.join(repoRoot, subfolder, 'app.json');
    if (fs.existsSync(jsonPath)) {
      const obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      obj.application = appVersion;
      obj.platform = appVersion;
      obj.runtime = runtime;
      if (Array.isArray(obj.dependencies)) {
        for (const dep of obj.dependencies) {
          if (dep.publisher === 'Microsoft' || dep.publisher === 'B.i.Team') {
            dep.version = appVersion;
          }
        }
      }
      fs.writeFileSync(jsonPath, JSON.stringify(obj, null, 2), 'utf8');
      updated.push(`${subfolder}/app.json`);
    } else {
      skipped.push(`${subfolder}/app.json`);
    }
  }

  // readme.md
  const readmePath = ['README.md', 'readme.md', 'Readme.md']
    .map(name => path.join(repoRoot, name))
    .find(p => fs.existsSync(p));
  if (readmePath) {
    let content = fs.readFileSync(readmePath, 'utf8');
    const before = content;
    content = content.replace(/^# D365BC-\d+ Project/m, `# D365BC-${versionStr} Project`);
    if (content !== before) {
      fs.writeFileSync(readmePath, content, 'utf8');
      updated.push(path.basename(readmePath));
    } else {
      vscode.window.showWarningMessage(
        vscode.l10n.t('BIT: readme.md found but no "# D365BC-XX Project" heading found.')
      );
    }
  } else {
    skipped.push('readme.md');
  }

  // Abschlussmeldung
  let msg = vscode.l10n.t('BIT: BC version updated to {0} ({1} file(s): {2}).', versionStr, String(updated.length), updated.join(', '));
  if (skipped.length > 0) {
    msg += ' ' + vscode.l10n.t('Not found: {0}.', skipped.join(', '));
  }
  const showRoot = vscode.l10n.t('Show repo root');
  vscode.window.showInformationMessage(msg, showRoot).then(sel => {
    if (sel === showRoot) {
      vscode.window.showInformationMessage(vscode.l10n.t('Git repo root: {0}', repoRoot));
    }
  });
}
