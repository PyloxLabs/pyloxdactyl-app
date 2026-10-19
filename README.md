# Pyloxdactyl

Native Android and iOS client for the Pyloxdactyl panel. Manage your game servers from your phone: live console, power controls, files, databases, backups, schedules, and more — plus full panel administration if you're a root admin.

## Device requirements

- **Android 7.0 or newer**
- **iOS 15.1 or newer** (iPhone and iPad, portrait only)
- An internet connection reachable to your Pyloxdactyl panel
- Plain `http://` panels are supported, but `https://` is recommended

> **Important:** the app only works with a **Pyloxdactyl** panel. Stock Pterodactyl panels are not supported.

## Getting started

1. Install the app (Android APK, or re-sign the iOS build for your device).
2. On first launch, enter your **panel URL** (e.g. `https://panel.example.com` or `http://192.168.1.10:5000` — include the port if it isn't standard). The app verifies it's a Pyloxdactyl panel before saving it.
3. Sign in with the **same username/email and password** you use on the web panel. If your account has two-factor authentication, enter the 6-digit code from your authenticator app.

That's it — your session is stored securely on-device. You can switch or forget the panel anytime from the Account tab.

## What you can do

### Servers

- **Console** — live output over WebSocket, send commands, start/restart/stop/kill
- **Live stats** — CPU, memory, disk, network, and uptime at a glance
- **Files** — browse, edit, rename, move, set permissions, create folders and archives, delete
- **Databases** — create and delete databases, view credentials
- **Backups** — create, restore, lock/unlock, and delete (password-protected actions)
- **Schedules** — automate start, restart, stop, or backup with cron expressions
- **Startup** — view the startup command, switch Docker image, edit egg variables
- **Subusers** — invite other panel users with fine-grained permissions
- **Settings** — rename the server, view/regenerate SFTP credentials, reinstall, accept the Minecraft EULA

Everything is permission-aware: options appear or hide based on what your panel account is allowed to do.

### Account

- Change your email or password
- Enable or disable two-factor authentication (QR code + secret shown)
- Switch between light, dark, or system theme
- Sign out or switch panels

### Admin (root administrators only)

- Panel-wide overview with user, server, and node stats
- Full user and server management, including server creation, build limits, network, and transfers
- Manage nodes, allocations, locations, nests, and eggs (with Pterodactyl egg JSON import)
- Panel settings: site name, timezone, 2FA policy, SMTP mail, and CAPTCHA

## Known limitations

- File upload, download, and public file links are not available in the mobile UI yet (use the web panel for those).
- If you lose your authenticator, a panel admin must reset your 2FA.
- iOS builds currently require sideloading or re-signing; there is no App Store release yet.
