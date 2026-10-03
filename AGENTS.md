# Repository conventions

- Run `npm run lint` and `npm run build` before reporting implementation work.
- Preserve IndexedDB records, stable IDs, and schema migrations. Do not seed or reset personal workspaces.
- Never read, print, commit, or document `.env` values. Do not place privileged Firebase credentials in the client.
- Report only tested functionality as released. Keep unfinished work under Unreleased in `CHANGELOG.md`.
- Use `apply_patch` for source edits and keep local/cloud persistence explicit.
