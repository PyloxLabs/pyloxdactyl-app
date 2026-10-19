# Pyloxdactyl

Native Android and iOS client for the Pyloxdactyl panel. Connect to a panel, sign in (including two-factor authentication), manage servers from the console, and administer panel resources as a root administrator.

Built with Expo SDK 58, React Native, Expo Router, and TypeScript. Releases are produced with EAS Build and delivered with EAS Update.

## Requirements

- Node.js 20 or newer
- A running Pyloxdactyl panel that exposes the mobile API at `/api/mobile`
- For store builds: an Expo account and an EAS project (`eas init`)

The panel must be reachable from the device. Panels served over plain HTTP are supported: Android enables cleartext traffic through `expo-build-properties`, and iOS allows arbitrary loads through `NSAppTransportSecurity` in `ios.infoPlist`.

## Development

```bash
npm install
npx expo start
```

Open the app in a development build, an emulator/simulator, or Expo Go (Expo Go only includes bundled native modules; use a development build after adding native code).

Useful checks:

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

Install Expo packages with `npx expo install <package>` so versions match the installed SDK.

## Project layout

- `src/app/` — Expo Router routes: connection and login flow, server tabs, server screens, admin screens
- `src/components/ui.tsx` — shared UI primitives and theming
- `src/lib/` — API client, types, formatting, secure storage, permission helpers
- `src/state/auth.tsx` — authentication state, panel session persistence, 401 handling
- `src/hooks/` — data loading and color scheme hooks

## Building with EAS

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production --platform ios
```

`eas.json` defines three profiles:

- `development` — development client, internal distribution
- `preview` — internal distribution, APK on Android
- `production` — store builds with automatic version increment

App versioning uses `appVersionSource: remote`. Signing credentials are managed by EAS.

## Release notes

- File upload, download, archive extraction sharing, and public file links are not exposed in the mobile UI yet. Browsing, editing, renaming, deleting, and creating directories are available.
- The iOS App Store may require a justification for `NSAllowsArbitraryLoads`; prefer an HTTPS panel for production distribution.
- Panel sessions are stored with `expo-secure-store` (localStorage on web). Signing out revokes the mobile API key on the panel.
