import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { downloadInstructionFiles } from './downloader';
import { updateBcVersion } from './bcVersionUpdater';

function findAlWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    return undefined;
  }

  for (const folder of folders) {
    const root = folder.uri.fsPath;
    // An AL workspace has app.json nested inside app/ and/or test/ subfolders.
    // We also accept a flat layout where app.json sits directly at the root.
    const candidates = [
      path.join(root, 'app', 'app.json'),
      path.join(root, 'test', 'app.json'),
      path.join(root, 'app.json')
    ];
    if (candidates.some(p => fs.existsSync(p))) {
      return root;
    }
  }

  return undefined;
}

export function activate(context: vscode.ExtensionContext): void {
  // Manual command — accessible from the Command Palette.
  const cmd = vscode.commands.registerCommand('biTeamALTools.download', async () => {
    const root = findAlWorkspaceRoot();
    if (!root) {
      vscode.window.showWarningMessage('BIT Instructions Sync: No AL workspace detected.');
      return;
    }
    await downloadInstructionFiles(root);
  });
  context.subscriptions.push(cmd);

  const cmdUpdate = vscode.commands.registerCommand('biTeamALTools.updateBcVersion', async () => {
    const root = findAlWorkspaceRoot();
    if (!root) {
      vscode.window.showWarningMessage('BIT Update BC Version: Kein AL-Workspace gefunden.');
      return;
    }
    await updateBcVersion(root);
  });
  context.subscriptions.push(cmdUpdate);

  // Auto-trigger when the extension activates (workspace already open).
  if (vscode.workspace.getConfiguration('biTeamALTools').get<boolean>('autoDownloadOnOpen', false)) {
    const root = findAlWorkspaceRoot();
    if (root) {
      downloadInstructionFiles(root);
    }
  }

  // Auto-trigger when workspace folders are added later.
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      if (vscode.workspace.getConfiguration('biTeamALTools').get<boolean>('autoDownloadOnOpen', false)) {
        const newRoot = findAlWorkspaceRoot();
        if (newRoot) {
          downloadInstructionFiles(newRoot);
        }
      }
    })
  );
}

export function deactivate(): void {}
