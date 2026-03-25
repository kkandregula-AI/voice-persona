# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/       # Express API server
│   └── mobile/           # Voice Persona AI (Expo + PWA)
├── lib/
│   ├── api-spec/         # OpenAPI spec + Orval codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/          # Generated Zod schemas from OpenAPI
│   └── db/               # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Voice Persona AI (`artifacts/mobile`)

A PWA-first mobile app built with Expo + React Native Web.

### Features
- **Voice Recording**: Record a 10–20 second voice sample using the microphone
- **3 TTS Modes**: Natural, News Anchor (formal), Storytelling (expressive)
- **Text-to-Speech**: Converts text to speech with tone based on the selected mode
- **Waveform Visualization**: Animated waveform bars during recording
- **History**: AsyncStorage-persisted history of all generated entries
- **PWA-ready**: Installable from browser, standalone display, proper manifest

### PWA Configuration
- `web.display: "standalone"` — fullscreen app-like experience
- `web.themeColor: "#050508"` — dark theme for browser chrome
- `apple-mobile-web-app-capable` meta tag — add to home screen on iOS
- Service worker handled automatically by Expo's Metro bundler

### Packages
- `expo-av` — microphone recording and audio playback
- `expo-speech` — text-to-speech (uses Web Speech API on web)
- `@react-native-async-storage/async-storage` — local history persistence
- `react-native-reanimated` — waveform animation
- `expo-haptics` — tactile feedback

### App Store path (next steps)
1. Run `expo build:ios` / `eas build` for iOS
2. Add `bundleIdentifier` in `app.json > ios`
3. Submit via EAS Submit or App Store Connect

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.
