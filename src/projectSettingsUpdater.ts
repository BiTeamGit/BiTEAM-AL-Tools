import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const COSMO_DEVOPS_EXT  = 'cosmoconsult.cosmo-azure-devops';
const COSMO_ALPACA_EXT  = 'cosmoconsult.cosmo-alpaca';
const RULESET_FILENAME  = 'BiTEAMRuleset.json';
const RULESET_REL_PATH  = '../BiTEAMRuleset.json';
const REQUIRED_CODECOPS = ['CodeCop', 'UICop', 'PerTenantExtensionCop'];

const DEFAULT_RULESET = {
  name: 'Project ruleset',
  description: 'Spezielle Anpassungen für Projekt',
  includedRuleSets: [],
  rules: [
    {
      id: 'AA0215',
      action: 'None',
      justification: "We don't want the prefix in the file name."
    },
    {
      id: 'AA0247',
      action: 'None',
      justification: "We don't do namespaces for now."
    }
  ]
};

export async function updateProjectSettings(workspaceRoot: string): Promise<void> {
  let repoRoot: string;
  try {
    repoRoot = execSync('git rev-parse --show-toplevel', { cwd: workspaceRoot }).toString().trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(vscode.l10n.t('BIT: Cannot determine git root — {0}', msg));
    return;
  }

  const updated: string[] = [];
  const alreadyOk: string[] = [];

  // ── .code-workspace ──────────────────────────────────────────────────────
  const workspaceFileName = fs.readdirSync(repoRoot).find(f => f.endsWith('.code-workspace'));
  if (workspaceFileName) {
    const wsPath = path.join(repoRoot, workspaceFileName);
    const wsObj  = JSON.parse(fs.readFileSync(wsPath, 'utf8'));
    let wsChanged = false;

    // extensions.recommendations: replace cosmo-azure-devops → cosmo-alpaca
    if (!wsObj.extensions) { wsObj.extensions = {}; }
    if (!Array.isArray(wsObj.extensions.recommendations)) { wsObj.extensions.recommendations = []; }

    const recs: string[] = wsObj.extensions.recommendations;
    const devopsIdx = recs.indexOf(COSMO_DEVOPS_EXT);
    const alpacaIdx = recs.indexOf(COSMO_ALPACA_EXT);

    if (devopsIdx !== -1) {
      if (alpacaIdx === -1) {
        recs[devopsIdx] = COSMO_ALPACA_EXT;   // replace
      } else {
        recs.splice(devopsIdx, 1);             // alpaca already there, just remove devops
      }
      wsChanged = true;
    }

    // settings: al.ruleSetPath
    if (!wsObj.settings) { wsObj.settings = {}; }
    if (wsObj.settings['al.ruleSetPath'] !== RULESET_REL_PATH) {
      wsObj.settings['al.ruleSetPath'] = RULESET_REL_PATH;
      wsChanged = true;
    }

    if (wsChanged) {
      fs.writeFileSync(wsPath, JSON.stringify(wsObj, null, 2), 'utf8');
      updated.push(workspaceFileName);
    } else {
      alreadyOk.push(workspaceFileName);
    }
  } else {
    vscode.window.showWarningMessage(
      vscode.l10n.t('BIT: No .code-workspace file found in repo root.')
    );
  }

  // ── BiTEAMRuleset.json ───────────────────────────────────────────────────
  const rulesetPath = path.join(repoRoot, RULESET_FILENAME);
  if (!fs.existsSync(rulesetPath)) {
    fs.writeFileSync(rulesetPath, JSON.stringify(DEFAULT_RULESET, null, 4), 'utf8');
    updated.push(RULESET_FILENAME);
  } else {
    alreadyOk.push(RULESET_FILENAME);
  }

  // ── .devops/cosmo.json ───────────────────────────────────────────────────
  const cosmoPath = path.join(repoRoot, '.devops', 'cosmo.json');
  if (fs.existsSync(cosmoPath)) {
    const cosmoObj = JSON.parse(fs.readFileSync(cosmoPath, 'utf8'));
    let cosmoChanged = false;

    if (cosmoObj.rulesetFile !== RULESET_REL_PATH) {
      cosmoObj.rulesetFile = RULESET_REL_PATH;
      cosmoChanged = true;
    }

    const hasAllCops =
      Array.isArray(cosmoObj.codeCops) &&
      REQUIRED_CODECOPS.every(c => cosmoObj.codeCops.includes(c));
    if (!hasAllCops) {
      cosmoObj.codeCops = REQUIRED_CODECOPS;
      cosmoChanged = true;
    }

    if (cosmoChanged) {
      fs.writeFileSync(cosmoPath, JSON.stringify(cosmoObj, null, 2), 'utf8');
      updated.push('.devops/cosmo.json');
    } else {
      alreadyOk.push('.devops/cosmo.json');
    }
  } else {
    vscode.window.showWarningMessage(
      vscode.l10n.t('BIT: .devops/cosmo.json not found.')
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const msg = updated.length > 0
    ? vscode.l10n.t('BIT: Project settings updated ({0}).', updated.join(', '))
    : vscode.l10n.t('BIT: Project settings already up to date — nothing changed.');
  vscode.window.showInformationMessage(msg);
}
