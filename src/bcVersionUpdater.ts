import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export async function updateBcVersion(workspaceRoot: string): Promise<void> {
  const input = await vscode.window.showInputBox({
    prompt: 'BC Major Version eingeben (z.B. 28)',
    placeHolder: '28',
    validateInput: v => /^\d+$/.test(v) ? null : 'Bitte eine Ganzzahl eingeben'
  });
  if (input === undefined) {
    return;
  }

  const bcVersion = parseInt(input, 10);
  const versionStr = String(bcVersion);
  const appVersion = `${bcVersion}.0.0.0`;
  const runtime = `${bcVersion - 11}.0`;
  const branchName = `Feature/BC${versionStr}Update`;

  try {
    execSync(`git checkout -b "${branchName}"`, { cwd: workspaceRoot });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`BIT Update BC Version: Branch "${branchName}" konnte nicht erstellt werden — ${msg}`);
    return;
  }

  const updated: string[] = [];
  const skipped: string[] = [];

  // .devops/cosmo.json — bcartifacts.current.version
  const cosmoPath = path.join(workspaceRoot, '.devops', 'cosmo.json');
  if (fs.existsSync(cosmoPath)) {
    const obj = JSON.parse(fs.readFileSync(cosmoPath, 'utf8'));
    if (obj?.bcartifacts?.current !== undefined) {
      obj.bcartifacts.current.version = versionStr;
      fs.writeFileSync(cosmoPath, JSON.stringify(obj, null, 2), 'utf8');
      updated.push('.devops/cosmo.json');
    } else {
      vscode.window.showWarningMessage(
        'BIT Update BC Version: .devops/cosmo.json gefunden, aber bcartifacts.current fehlt.'
      );
    }
  } else {
    skipped.push('.devops/cosmo.json');
  }

  // azure-pipeline.yml — value unterhalb von name: "Version.Major"
  const pipelinePath = path.join(workspaceRoot, 'azure-pipeline.yml');
  if (fs.existsSync(pipelinePath)) {
    let content = fs.readFileSync(pipelinePath, 'utf8');
    const before = content;
    content = content.replace(
      /(-\s+name:\s*["']?Version\.Major["']?\s*\r?\n\s*value:\s*["']?)\d+(["']?)/,
      `$1${versionStr}$2`
    );
    if (content !== before) {
      fs.writeFileSync(pipelinePath, content, 'utf8');
      updated.push('azure-pipeline.yml');
    } else {
      vscode.window.showWarningMessage(
        'BIT Update BC Version: azure-pipeline.yml gefunden, aber Version.Major nicht ersetzt — Struktur prüfen.'
      );
    }
  } else {
    skipped.push('azure-pipeline.yml');
  }

  // app/app.json und test/app.json
  for (const subfolder of ['app', 'test']) {
    const jsonPath = path.join(workspaceRoot, subfolder, 'app.json');
    if (fs.existsSync(jsonPath)) {
      const obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      obj.application = appVersion;
      obj.platform = appVersion;
      obj.runtime = runtime;
      fs.writeFileSync(jsonPath, JSON.stringify(obj, null, 2), 'utf8');
      updated.push(`${subfolder}/app.json`);
    } else {
      skipped.push(`${subfolder}/app.json`);
    }
  }

  // README.md — # D365BC-XX Project
  const readmePath = path.join(workspaceRoot, 'README.md');
  if (fs.existsSync(readmePath)) {
    let content = fs.readFileSync(readmePath, 'utf8');
    const before = content;
    content = content.replace(/^# D365BC-\d+ Project/m, `# D365BC-${versionStr} Project`);
    if (content !== before) {
      fs.writeFileSync(readmePath, content, 'utf8');
      updated.push('README.md');
    } else {
      vscode.window.showWarningMessage(
        'BIT Update BC Version: README.md gefunden, aber kein "# D365BC-XX Project"-Heading gefunden.'
      );
    }
  } else {
    skipped.push('README.md');
  }

  // Abschlussmeldung
  let msg = `BIT: BC Version auf ${versionStr} aktualisiert (${updated.length} Datei(en): ${updated.join(', ')}).`;
  if (skipped.length > 0) {
    msg += ` Nicht gefunden: ${skipped.join(', ')}.`;
  }
  vscode.window.showInformationMessage(msg);
}
