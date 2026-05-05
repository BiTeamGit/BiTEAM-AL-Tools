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
  const config = vscode.workspace.getConfiguration('biTeamALInstructions');
  const orgUrl = config.get<string>('orgUrl', '').replace(/\/$/, '');
  const project = config.get<string>('project', '');
  const repository = config.get<string>('repository', '');
  const folders = config.get<string[]>('folders', ['.claude', '.github']);

  if (!orgUrl || !project || !repository) {
    vscode.window.showErrorMessage(
      'AL Instructions Sync: Configure biTeamALTools.orgUrl, .project and .repository in settings.'
    );
    return;
  }

  let token: string;
  try {
    token = await getToken();
  } catch (err) {
    vscode.window.showErrorMessage(`AL Instructions Sync: Authentication failed — ${err}`);
    return;
  }

  const repoBase =
    `${orgUrl}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repository)}`;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'AL Instructions Sync: downloading…',
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
          vscode.window.showWarningMessage(`AL Instructions Sync: Cannot list "${folder}" — ${err}`);
          continue;
        }

        for (const item of items) {
          if (item.gitObjectType !== 'blob') {
            continue;
          }

          // item.path looks like /.claude/settings.json — strip the leading /
          const relative = item.path.startsWith('/') ? item.path.slice(1) : item.path;
          const target = path.join(workspaceRoot, relative);
          fs.mkdirSync(path.dirname(target), { recursive: true });

          const downloadUrl =
            `${repoBase}/items?path=${encodeURIComponent(item.path)}&download=true&api-version=7.0`;
          try {
            const buf = await apiFetch(downloadUrl, token, true) as ArrayBuffer;
            fs.writeFileSync(target, Buffer.from(buf));
          } catch (err) {
            vscode.window.showWarningMessage(`AL Instructions Sync: Cannot download "${item.path}" — ${err}`);
          }
        }
      }
    }
  );

  vscode.window.showInformationMessage('AL Instructions Sync: instruction files updated.');
}
