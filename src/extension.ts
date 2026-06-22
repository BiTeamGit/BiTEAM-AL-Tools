import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { downloadInstructionFiles } from './downloader';
import { updateBcVersion } from './bcVersionUpdater';
import { updateProjectSettings } from './projectSettingsUpdater';

interface WorkspaceFolder {
  uri: { fsPath: string };
}

export function findAlWorkspaceRoot(
  folders: readonly WorkspaceFolder[] | undefined,
  existsFn: (p: string) => boolean = fs.existsSync
): string | undefined {
  if (!folders) {
    return undefined;
  }

  for (const folder of folders) {
    const root = folder.uri.fsPath;
    if (existsFn(path.join(root, 'app', 'app.json'))) { return root; }
    if (existsFn(path.join(root, 'test', 'app.json'))) { return root; }
    if (existsFn(path.join(root, 'app.json'))) {
      // In a multi-root workspace the workspace folder itself is the app/ or test/ subfolder.
      // Go up one level to reach the true project root.
      const name = path.basename(root).toLowerCase();
      return (name === 'app' || name === 'test') ? path.dirname(root) : root;
    }
  }

  return undefined;
}

export function activate(context: vscode.ExtensionContext): void {
  // Manual command — accessible from the Command Palette.
  const cmd = vscode.commands.registerCommand('biTeamALTools.download', async () => {
    const root = findAlWorkspaceRoot(vscode.workspace.workspaceFolders);
    if (!root) {
      vscode.window.showWarningMessage(vscode.l10n.t('BIT: No AL workspace detected.'));
      return;
    }
    await downloadInstructionFiles(root);
  });
  context.subscriptions.push(cmd);

  const cmdUpdate = vscode.commands.registerCommand('biTeamALTools.updateBcVersion', async () => {
    const root = findAlWorkspaceRoot(vscode.workspace.workspaceFolders);
    if (!root) {
      vscode.window.showWarningMessage(vscode.l10n.t('BIT: No AL workspace detected.'));
      return;
    }
    await updateBcVersion(root);
  });
  context.subscriptions.push(cmdUpdate);

  const cmdProjectSettings = vscode.commands.registerCommand('biTeamALTools.updateProjectSettings', async () => {
    const root = findAlWorkspaceRoot(vscode.workspace.workspaceFolders);
    if (!root) {
      vscode.window.showWarningMessage(vscode.l10n.t('BIT: No AL workspace detected.'));
      return;
    }
    await updateProjectSettings(root);
  });
  context.subscriptions.push(cmdProjectSettings);

  // Auto-trigger when the extension activates (workspace already open).
  if (vscode.workspace.getConfiguration('biTeamALTools').get<boolean>('autoDownloadOnOpen', false)) {
    const root = findAlWorkspaceRoot(vscode.workspace.workspaceFolders);
    if (root) {
      downloadInstructionFiles(root);
    }
  }

  // Auto-trigger when workspace folders are added later.
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      if (vscode.workspace.getConfiguration('biTeamALTools').get<boolean>('autoDownloadOnOpen', false)) {
        const newRoot = findAlWorkspaceRoot(vscode.workspace.workspaceFolders);
        if (newRoot) {
          downloadInstructionFiles(newRoot);
        }
      }
    })
  );
}

export function deactivate(): void {}
