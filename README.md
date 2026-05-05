# BiTeam AL Tools

A VS Code extension with tools for Business Central AL development: keeps AI instruction files in sync across workspaces and automates BC version updates.

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
- **`BIT: Download Instruction Files`** — manually trigger the download via the Command Palette (`Ctrl+Shift+P`)
- **`BIT: Update BC Version`** — updates `.devops/cosmo.json`, `azure-pipeline.yml`, `app/app.json`, `test/app.json`, and `README.md` to a new BC major version in one step; creates a `Feature/BC{Version}Update` branch automatically
- **Microsoft account auth** — uses the account you are already signed in with in VS Code, no PAT required
- **Configurable** — control which Azure DevOps repo and which folders to download

## Requirements

- VS Code 1.85 or later
- Signed in to VS Code with a Microsoft account that has read access to the Azure DevOps repository

## Configuration

Add the following to your VS Code `settings.json` (user or workspace level):

```json
"biTeamALTools.orgUrl": "https://dev.azure.com/your-org",
"biTeamALTools.project":  "YourProject",
"biTeamALTools.repository": "YourRepository"
```

| Setting | Description | Default |
|--------|-------------|---------|
| `biTeamALTools.orgUrl` | Azure DevOps organization URL | _(required)_ |
| `biTeamALTools.project` | Azure DevOps project name | _(required)_ |
| `biTeamALTools.repository` | Azure DevOps repository name | _(required)_ |
| `biTeamALTools.folders` | Folders to download from the repo root | `[".claude", ".github"]` |

## Development

```bash
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host for testing.
