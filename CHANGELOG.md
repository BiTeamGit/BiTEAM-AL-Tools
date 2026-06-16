# Changelog

## [0.1.5] — 2026-06-16

### Fixed
- Download instruction files now correctly resolves the project root in multi-root workspaces where `app` and `test` are separate workspace folders. Files are placed alongside `app` and `test` instead of inside them.

### Added
- Downloaded folders (`.claude`, `.github`) are automatically added to the VS Code workspace after download so they appear in the Explorer sidebar. Folders are only added if at least one file was successfully written.

## [0.1.0] — 2026-05-05

### Added
- `BIT: Download Instruction Files` — downloads configured folders (`.claude`, `.github`) from a central Azure DevOps repository into the open AL workspace. Triggers automatically on workspace open and is available via the Command Palette.
- `BIT: Update BC Version` — updates all version-related files in an AL repository to a new Business Central major version: `.devops/cosmo.json`, `azure-pipeline.yml`, `app/app.json`, `test/app.json`, `README.md`. Creates a `Feature/BC{Version}Update` git branch automatically.
- Microsoft account authentication — no Personal Access Token required.
