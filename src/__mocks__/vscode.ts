export const window = {
  showInputBox: async () => undefined,
  showQuickPick: async () => undefined,
  showErrorMessage: () => undefined,
  showWarningMessage: () => undefined,
  showInformationMessage: async () => undefined,
  withProgress: async (_opts: unknown, task: () => Promise<void>) => task(),
};
export const workspace = {
  getConfiguration: () => ({ get: (_key: string, def: unknown) => def }),
  workspaceFolders: undefined as undefined,
  updateWorkspaceFolders: () => false,
  onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
};
export const l10n = { t: (msg: string) => msg };
export const authentication = {
  getSession: async () => ({ accessToken: '' }),
};
export const Uri = { file: (p: string) => ({ fsPath: p }) };
export const ProgressLocation = { Notification: 15 };
export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
};
