# BiTeam AL Tools

A VS Code extension with tools for Business Central AL development: keeps AI instruction files in sync across workspaces and automates BC version updates.

## Commands

### `BIT: Download Instruction Files`

Downloads configured folders (default: `.claude`, `.github`) from a central Azure DevOps repository into the open AL workspace. Authenticates via the Microsoft account already signed in to VS Code — no Personal Access Token required.

Can also be triggered automatically when an AL workspace is opened (see `biTeamALTools.autoDownloadOnOpen`).

```
MyApp/
├── app/
├── test/
├── .claude/       ← downloaded from Azure DevOps
└── .github/       ← downloaded from Azure DevOps
```

### `BIT: Update BC Version`

Updates all version-relevant files in an AL repository to a new Business Central major version in one step.

**What it updates:**

| File | Field(s) |
|---|---|
| `.devops/cosmo.json` | `bcArtifacts.current.version` |
| `.devops/cosmo.json` | `devopsArtifacts[].feed` — renames `easyAddons_BC{old}` to `easyAddons` or `easyAddons_BC{new}` (only asked if easyAddons entries are present) |
| `.devops/azure-pipeline.yml` | `value` of the `Version.Major` variable |
| `app/app.json` | `application`, `platform`, `runtime`, Microsoft and B.i.Team dependency versions |
| `test/app.json` | same as `app/app.json` |
| `readme.md` | `# D365BC-{Version} Project` heading |

**Runtime formula:** `runtime = BCVersion − 11` (e.g. BC 28 → `17.0`)

**Branch:** Creates `Feature/BC{Version}Update` automatically, or switches to it if it already exists.

### `BIT: Update Project Settings`

Prüft und aktualisiert die Projektstruktur eines AL-Repos auf den BiTeam-Standard — idempotent, d.h. bereits korrekte Einstellungen werden nicht verändert.

**Was geprüft und ggf. angepasst wird:**

| Datei | Feld / Eintrag | Aktion |
|---|---|---|
| `*.code-workspace` | `extensions.recommendations` | `cosmo-azure-devops` → `cosmo-alpaca` |
| `*.code-workspace` | `settings.al.ruleSetPath` | Auf `"../BiTEAMRuleset.json"` setzen |
| `BiTEAMRuleset.json` | _(Datei)_ | Anlegen falls nicht vorhanden (mit Standardregeln AA0215, AA0247) |
| `.devops/cosmo.json` | `rulesetFile` | Auf `"../BiTEAMRuleset.json"` setzen |
| `.devops/cosmo.json` | `codeCops` | `["CodeCop", "UICop", "PerTenantExtensionCop"]` eintragen falls fehlend |

## Requirements

- VS Code 1.85 or later
- Signed in to VS Code with a Microsoft account that has read access to the Azure DevOps repository (for `BIT: Download Instruction Files`)

## Configuration

Add the following to your VS Code `settings.json` (user or workspace level):

```json
"biTeamALTools.orgUrl": "https://dev.azure.com/your-org",
"biTeamALTools.project": "YourProject",
"biTeamALTools.repository": "YourRepository"
```

| Setting | Description | Default |
|---|---|---|
| `biTeamALTools.orgUrl` | Azure DevOps organization URL | _(required)_ |
| `biTeamALTools.project` | Azure DevOps project name | _(required)_ |
| `biTeamALTools.repository` | Azure DevOps repository name | _(required)_ |
| `biTeamALTools.folders` | Folders to download from the repo root | `[".claude", ".github"]` |
| `biTeamALTools.autoDownloadOnOpen` | Automatically download instruction files when an AL workspace is opened | `false` |

## Development

```bash
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host for testing.
