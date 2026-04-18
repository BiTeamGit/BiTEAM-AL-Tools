# BiTeam AL Instructions Sync

A VS Code extension that keeps AI instruction files in sync across all your AL (Business Central) workspaces by downloading them from a central Azure DevOps repository.

## How it works

When you open an AL workspace (a folder containing `app/app.json` or `test/app.json`), the extension automatically downloads configured folders from your Azure DevOps repository into the workspace root. The result is:

```
MyApp/
├── app/
├── test/
├── .claude/       ← downloaded from Azure DevOps
└── .github/       ← downloaded from Azure DevOps
```

You can also trigger the download manually at any time via the Command Palette.

## Features

- **Auto-sync on open** — downloads instruction files whenever an AL workspace is opened
- **Manual command** — run `AL: Download Instruction Files` from the Command Palette (`Ctrl+Shift+P`)
- **Microsoft account auth** — uses the account you are already signed in with in VS Code, no PAT required
- **Configurable** — control which Azure DevOps repo and which folders to download

## Requirements

- VS Code 1.85 or later
- Signed in to VS Code with a Microsoft account that has read access to the Azure DevOps repository

## Configuration

Add the following to your VS Code `settings.json` (user or workspace level):

```json
"biTeamALInstructions.orgUrl": "https://dev.azure.com/your-org",
"biTeamALInstructions.project": "YourProject",
"biTeamALInstructions.repository": "YourRepository"
```

| Setting | Description | Default |
|--------|-------------|---------|
| `biTeamALInstructions.orgUrl` | Azure DevOps organization URL | _(required)_ |
| `biTeamALInstructions.project` | Azure DevOps project name | _(required)_ |
| `biTeamALInstructions.repository` | Azure DevOps repository name | _(required)_ |
| `biTeamALInstructions.folders` | Folders to download from the repo root | `[".claude", ".github"]` |

## Development

```bash
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host for testing.
