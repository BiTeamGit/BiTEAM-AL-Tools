# BiTEAM-AL-Tools

VS Code extension that streamlines Business Central (D365 BC) AL development workflows for the BiTeam. Written in TypeScript, targets VS Code 1.85.0+.

## Project Structure

```
src/
  extension.ts            # Entry point — activates on workspaces with app.json, registers commands
  downloader.ts           # Downloads .claude/.github folders from Azure DevOps via Microsoft auth
  bcVersionUpdater.ts     # Updates BC major version across all config files, creates feature branch
  projectSettingsUpdater.ts # Enforces BiTeam project standards (extensions, linter rules, CodeCops)
l10n/
  bundle.l10n.de.json     # German runtime message translations
package.json              # Extension manifest, commands, configuration schema
package.nls.json          # English UI strings
package.nls.de.json       # German UI strings
```

## Commands

| Command | ID | Purpose |
|---|---|---|
| BIT: Download Instruction Files | `biTeamALTools.download` | Sync `.claude`/`.github` folders from Azure DevOps |
| BIT: Update BC Version | `biTeamALTools.updateBcVersion` | Bump BC major version across all config files and create a feature branch |
| BIT: Update Project Settings | `biTeamALTools.updateProjectSettings` | Standardize workspace config, linter rules, and CodeCops |

## Key Implementation Details

**Authentication:** Uses VS Code's built-in Microsoft authentication (Azure DevOps scope `499b84ac-1321-427f-aa17-267ca6975798`) — no PAT tokens required.

**BC Version Update (`bcVersionUpdater.ts`):**
- Prompts for new BC major version (e.g. `28`)
- Creates/switches to branch `Feature/BC{Version}Update` via `child_process` git calls
- Updates 6+ file types: `.devops/cosmo.json`, `.devops/azure-pipeline.yml`, `app/app.json`, `test/app.json`, `README.md`
- Runtime formula: `runtime = BCVersion - 11` (BC 28 → runtime 17.0)

**Project Settings Updater (`projectSettingsUpdater.ts`):**
- Replaces deprecated extension `cosmo-azure-devops` → `cosmo-alpaca` in `.code-workspace`
- Sets AL linter ruleset path to `../BiTEAMRuleset.json`
- Creates `BiTEAMRuleset.json` with AA0215 and AA0247 disabled
- Ensures `CodeCop`, `UICop`, `PerTenantExtensionCop` are present in `.devops/cosmo.json`

**Workspace Detection (`findAlWorkspaceRoot()` in `extension.ts`):**
- Supports flat (`app.json` at root) and nested (`app/app.json`) AL workspace layouts
- Auto-download fires on extension startup or workspace folder change if `autoDownloadOnOpen: true`

## Build & Dev

```bash
npm install          # install dev dependencies
npm run compile      # tsc one-shot build → out/
npm run watch        # tsc watch mode
# F5 in VS Code → Extension Development Host
# vsce package       # build .vsix for distribution
```

Output goes to `out/`. Entry point referenced in `package.json` is `out/extension.js`.

## Configuration (settings.json)

All settings use the `biTeamALTools` prefix:

| Setting | Type | Description |
|---|---|---|
| `orgUrl` | string | Azure DevOps organization URL |
| `project` | string | Azure DevOps project name |
| `repository` | string | Azure DevOps repository name |
| `folders` | string[] | Folders to download (default: `[".claude", ".github"]`) |
| `autoDownloadOnOpen` | boolean | Auto-download on workspace open (default: false) |

## Localization

- English (default): `package.nls.json` + built-in strings
- German: `package.nls.de.json` + `l10n/bundle.l10n.de.json`
- Runtime strings use `vscode.l10n.t()`

## Tech Stack

- TypeScript 5.3, strict mode, CommonJS output (ES2024 target)
- VS Code Extension API (@types/vscode ^1.85.0)
- Node.js built-ins: `fs`, `path`, `child_process`
- No runtime npm dependencies — dev-only (`typescript`)

## Metadata

- Publisher: `biteam` | Version: `0.1.4`
- License: MIT | Author: Matthias Rabus
- Activates on: `workspaceContains:**/app.json`
