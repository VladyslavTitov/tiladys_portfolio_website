# Use this prompt in Visual Studio Code

1. Download and extract the full handoff ZIP.
2. Open the existing TiLADYS repository in Visual Studio Code. Copy the contents of the extracted `TiLADYS_Codex_Handoff` folder into `docs/tiladys-rebuild/`, so the prompt and its `reference/` directory sit together. Keep this folder outside public assets and application bundles.
3. Open Codex in that repository and paste the complete contents of `TiLADYS_Master_Prompt.md` or `TiLADYS_Master_Prompt.txt` as the task. Codex should implement and verify the redesign; it should start by inspecting the actual current checkout.

If you place the folder elsewhere, tell Codex its actual relative location. Do not paste ChatGPT scratch paths or file IDs into the application. The `.txt` file contains the same prompt as the `.md` file; Markdown syntax is safe to paste into Codex.

## Included references

- The supplied 77-page analysis PDF and equivalent editable analysis.
- Control, asset and acceptance registers and canonical design tokens.
- Nine approved public visual boards and thirteen dashboard boards.
- `reference/Reference-index.json` maps board filenames to canonical page IDs. Board labels from the older dashboard kit use a different numbering system.
- Audit provenance and a SHA-256 file manifest.

The generated boards are design references, not public portfolio proof or production data. Native interface text, icons, backgrounds and layouts must be built as code. Preserve actual customer/invoice/project records and original brand assets.

## Current requirements

New invoices: complete German first, English next on a fresh page. Historical issued PDFs stay unchanged. The actual live footer takes precedence over all generated footers. Existing authentication and the working public/control architecture are preserved.

This handoff creates no application changes by itself. The implementation prompt authorizes local work and isolated development tests. Production changes, real customer mail, real financial mutations, publication and deployment are outside that task until separately authorized.

Business tax settings, real bank/payment details, actual product licenses/media, storage configuration and recovery arrangements are explicit launch dependencies. Codex should finish independent development work and report the affected gated operations, rather than guess these facts.
