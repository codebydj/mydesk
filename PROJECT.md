# MyDesk

MyDesk is a private, local-first workspace for tasks, projects, notes, college work, and intentional focus sessions.

## Architecture

React + TypeScript + Vite renders a browser workspace stored in IndexedDB. `src/store.ts` migrates records to schema 2 while preserving IDs. Firebase may initialize from Vite environment variables, but cloud authentication, migration, and synchronization are not released.

## Implemented

Local tasks with dates, priority, subtasks, completion and Trash; date-specific daily priorities (maximum three); daily date navigation and unfinished-work review; projects; inbox-to-task conversion; plain-text notes/bookmarks; subjects; focus timer state; local export; theme and privacy masking.

## Limitations

Import UI, recurring tasks, calendar, project detail editing, note lifecycle UI, coding journal, review, and cloud records are not released. Browser storage is not encrypted or a backup.

## Roadmap

1. Complete project/note lifecycle and import preview.
2. Recurrence, calendar, and linked focus.
3. College, journal, and review workflows.
4. Independently test Firebase auth, rules, migration, and sync.
