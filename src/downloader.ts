import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface GitItem {
  path: string;
  gitObjectType: 'blob' | 'tree' | 'commit';
}

interface GitItemsResponse {
  value: GitItem[];
}

async function getToken(): Promise<string> {
  // Uses the signed-in Microsoft account in VS Code — no PAT needed.
  // Scope 499b84ac-... is the Azure DevOps resource id.
  const session = await vscode.authentication.getSession(
    'microsoft',
    ['499b84ac-1321-427f-aa17-267ca6975798/.default'],
    { createIfNone: true }
  );
  return session.accessToken;
}

async function apiFetch(url: string, token: string, binary?: false): Promise<string>;
async function apiFetch(url: string, token: string, binary: true): Promise<ArrayBuffer>;
async function apiFetch(url: string, token: string, binary = false): Promise<string | ArrayBuffer> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return binary ? response.arrayBuffer() : response.text();
}

export async function downloadInstructionFiles(workspaceRoot: string): Promise<void> {
  const config = vscode.workspace.getConfiguration('biTeamALTools');
  const orgUrl = config.get<string>('orgUrl', '').replace(/\/$/, '');
  const project = config.get<string>('project', '');
  const repository = config.get<string>('repository', '');
  const folders = config.get<string[]>('folders', ['.claude', '.github']);

  if (!orgUrl || !project || !repository) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('BIT: Configure biTeamALTools.orgUrl, .project and .repository in settings.')
    );
    return;
  }

  let token: string;
  try {
    token = await getToken();
  } catch (err) {
    vscode.window.showErrorMessage(vscode.l10n.t('BIT: Authentication failed — {0}', String(err)));
    return;
  }

  const repoBase =
    `${orgUrl}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repository)}`;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: vscode.l10n.t('BIT: Downloading instruction files…'),
      cancellable: false
    },
    async () => {
      for (const folder of folders) {
        const scopePath = folder.startsWith('/') ? folder : `/${folder}`;
        const listUrl =
          `${repoBase}/items?scopePath=${encodeURIComponent(scopePath)}&recursionLevel=Full&api-version=7.0`;

        let items: GitItem[];
        try {
          const json = await apiFetch(listUrl, token) as string;
          const body: GitItemsResponse = JSON.parse(json);
          items = body.value;
        } catch (err) {
          vscode.window.showWarningMessage(vscode.l10n.t('BIT: Cannot list "{0}" — {1}', folder, String(err)));
          continue;
        }

        const blobs = items.filter(
          item => item.gitObjectType === 'blob' && !item.path.endsWith('.gitkeep')
        );
        if (blobs.length === 0) {
          continue;
        }

        let filesWritten = 0;
        for (const item of blobs) {
          // item.path looks like /.claude/settings.json — strip the leading /
          const relative = item.path.startsWith('/') ? item.path.slice(1) : item.path;
          const target = path.join(workspaceRoot, 'app', relative);
          fs.mkdirSync(path.dirname(target), { recursive: true });

          const downloadUrl =
            `${repoBase}/items?path=${encodeURIComponent(item.path)}&download=true&api-version=7.0`;
          try {
            const buf = await apiFetch(downloadUrl, token, true) as ArrayBuffer;
            fs.writeFileSync(target, Buffer.from(buf));
            filesWritten++;
          } catch (err) {
            vscode.window.showWarningMessage(vscode.l10n.t('BIT: Cannot download "{0}" — {1}', item.path, String(err)));
          }
        }

      }
    }
  );

  vscode.window.showInformationMessage(vscode.l10n.t('BIT: Instruction files updated.'));
}
