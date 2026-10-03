# Changelog

## Unreleased

- Version 1.0.1 candidate: logo integration, optional Firebase login/signup, email verification, password reset, explicit session persistence and privacy/security pages. Real provider operations and Android execution require separate end-to-end verification; cloud sync is not enabled.
- Account-scoped local workspace keys preserve the existing personal key and flush pending saves before switching accounts. Named test workspaces remain isolated.
- Verification for the 1.0.1 candidate: lint, TypeScript/production build and 14 tests pass (authentication SDK tests are mocked; account storage tests use in-memory IndexedDB). Browser inspection covered account/guest navigation, privacy/security pages, light/dark responsive layouts, test task creation/completion/reload. Dependency audit reports zero known vulnerabilities.
- Android web-asset sync passed; APK compilation failed because the Android SDK location was unavailable. No APK was produced, and no live account operations, deployment or Android device behavior were verified.

- Rebuilt the rendered shell and all workspace pages with grouped icon navigation, compact task rows, a 2:1 Today dashboard, responsive bottom navigation, and readable light/dark surfaces.
- Added project/subject editing, linked work, direct search editors, record-wide Archive/Trash/restore, guarded Undo, safe bookmarks, and validated import previews with merge/replacement and persistent recovery copies.
- Workspace schema v4 preserves existing IDs and records; named test workspaces isolate validation. Local save failures no longer silently open an empty workspace.
- Browser checks passed for creation/editing, task dates/subtasks/completion, project/subject associations, inbox conversion, note reload/search/privacy, timer start/pause/resume/reload, import validation/merge/replacement/recovery, mobile navigation and recoverable task deletion/restoration.
- Empty and populated Today inspected at 375×812, 768×1024, 1280×800, and 1440×900 without horizontal overflow. Eight automated migration/import/lifecycle/conversion/timer tests pass.
- Not verified end-to-end: native file chooser, completed download, permanent deletion, and natural 25-minute timer completion. Cloud synchronization remains unavailable.

- Editorial shell and semantic token refactor.
- Documentation and release-history surfaces.
- Date-specific daily priorities, date navigation, and unfinished-task review (verified locally; remains Unreleased).

## 0.2.0 — 2026-10-03

Initial documented local-first baseline: task editor, notes, inbox capture, projects, focus state, schema v2 migration, local backup export, and optional Firebase initialization/rules foundation. Cloud records, import UI, recurrence, and project detail workflows were not released.
