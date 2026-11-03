# Cynthia Mobile Proto — Self Assembler (working prototype)

Extends the user's existing `justappgrabbin/cynthia-mobile-proto` repository on an **integration branch**, preserving the two historical workflow source fragments unchanged on `main`. It implements a real offline, phone-first self-assembler; it does not replace the existing Synthia Computer or sealed Foundry system.

## Features that actually work in this prototype

- Select/paste HTML, CSS, JS, JSON, SVG, text and Markdown files (2 MB/file, 40 files).
- Validate JavaScript syntax and JSON content. Assemble HTML + browser-style CSS and non-module JS into a complete single HTML application.
- Render the output in a sandboxed iframe; unsupported imports are preserved as source and reported rather than falsely executed.
- Persist saved projects and their last five versions in IndexedDB (localStorage fallback), open and roll back previous versions.
- Install an assembled project as a launchable Cynthia tool without altering Cynthia core files.
- Export a runnable HTML file or `.cynthia.json` project backup. Android uses the system document picker.
- Optional OpenAI-compatible model integration for *proposed* source changes. Review before applying; no silent AI updates, no fake model, no API keys bundled.

## Android

A minimal Java WebView host wraps Cynthia's offline interface. `app/src/main/assets/` contains all app sources. Android package ID: `com.cynthia.mobileproto` (from the earlier prototype specification); minimum Android version: 7.0 (API 24). Save/download invokes the Android document picker. AI endpoint may require network and CORS configuration; app works offline for deterministic assembling.

## Build an APK automatically

On push to `integration/cynthia-self-assembler-20261103`, GitHub Actions runs tests, compiles `:app:assembleDebug`, and uploads an APK artifact named **Cynthia-SelfAssembler-Debug-APK**. This is a debug-signed test package, **not a Play Store release**. No Expo token is required.

Manual build with Android SDK, Java 17 and Gradle 8.10.2:

```
gradle :app:assembleDebug
```

Expected output: `app/build/outputs/apk/debug/app-debug.apk`.

## Honest limitations

This is an early extension point, **not** the full Trident GNN/agent runtime or a self-compiled native application. It assembles browser-ready HTML/CSS/JS; React/TS/TSX/Python, complex dependencies, APK generation *from user projects*, ZIP extraction, Drive ingestion, external cloud deployment, and complete Synthia integration are not present. Imported source is never automatically published. No physical phone installation has been verified.

Sources of requirements: the user's Google Drive `Mobile App Proto Builder` and `Self-Building Human Design App — Core Architecture`, plus the reassembly master build and Synthia r22.2 verification notes. This branch does not modify Foundry.
