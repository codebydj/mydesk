# MyDesk

Private local-first workspace. Data is stored in this browser using IndexedDB; it is not encrypted. Export backups regularly. Optional Firebase account access does not enable cloud synchronization.

## Windows CMD

```cmd
npm install
npm run dev
```

Then open the URL Vite prints (normally `http://localhost:5173`). For a production check: `npm run build`.

## Optional accounts

Login and signup are at `/login` and `/signup`. MyDesk uses the existing public Firebase client configuration (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`); never commit `.env` or put administrator credentials in the client. Enable Email/Password in your Firebase Authentication project, review its password policy and email-enumeration protection, and configure authorized domains and email templates before live use. No project or account was created during implementation.

Sessions default to browser-session persistence; “Remember me” explicitly selects persistent device sessions. Signup requests email verification; verified accounts use separate account-local workspace keys. The original `personal` workspace remains available after signing out, without automatic transfer or overwrite. Privacy/security pages explain provider processing and unencrypted local storage. Real sign-in, signup, verification-email delivery and password reset have not been tested against live accounts. Cloud sync and account deletion are not implemented.

## Data and privacy

Existing records are migrated to workspace schema version 4 on load without changing IDs. Tasks, notes, projects, inbox items, college subjects, focus-session history, date-specific priorities, theme, and privacy preferences stay in the same browser workspace. Privacy mode masks record content and disables sensitive editing/search; it does not encrypt stored data. A URL such as `http://localhost:5173/?workspace=my-test` uses a separate test record key, carried through navigation, without changing personal records.

Settings accepts backup files or pasted JSON, validates records and URLs, and previews incoming counts and ID conflicts. Merge keeps existing records on collisions. Replacement requires an explicit choice and saves a local recovery copy before changing records. The recovery can be previewed and imported again from Settings. File export requests were exercised, but download completion and the native file chooser could not be confirmed in the embedded test browser.

## Versioning

Current application version: `1.0.1` candidate; workspace schema version: `4` (IndexedDB database remains version 3). Unverified account operations and Android execution remain Unreleased. Undo is available for the last reversible action in the current session; permanent deletion and a full 25-minute browser session were not exercised end-to-end.

## Android package

The Capacitor Android project bundles the production app locally, with package ID `com.mydesk.workspace`, version name `1.0.1`, version code `10001`, the supplied logo, disabled Android backup and no cleartext network traffic. Browser and Android storage are separate; use validated backup export/import to transfer records. Android behavior and backup downloads are not yet device-tested.

Install/configure the Android SDK (API 36) and Java 21, then from this repository run:

```cmd
npm ci
npm run android:apk
```

Expected successful output: `android\app\build\outputs\apk\debug\app-debug.apk` (debug-signed, not a production release). The attempted build synced web assets but failed because no Android SDK location was configured. No APK was produced. `npm run android:open` opens the native project if Android Studio is installed. Release distribution requires your own securely managed signing key and device verification; no signing secrets are included.
