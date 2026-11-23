# Project Context

## Overview
- **Purpose:** Cross-platform mobile barcode-scanning and price-checking application that tracks and compares product prices across multiple stores and vendors.
- **Tech Stack:** Expo (SDK 57), React Native (0.86, New Architecture), TypeScript, Expo Router, NativeWind (Tailwind CSS), React Native Reusables, React Native Reanimated (v4), Expo Camera (`expo-camera`), Lucide React Native, Supabase (planned), `pnpm`, EAS Build.

## Directory Structure
- `app/` — Expo Router file-based layouts and screens (`_layout.tsx`, `(tabs)/_layout.tsx`, `(tabs)/index.tsx` Scanner, `(tabs)/stores.tsx`, `(tabs)/products.tsx`).
- `components/` — React Native Reusables UI primitives (`components/ui/`) and domain components (`components/scanner/`, `components/stores/`, `components/products/`).
- `context/` — Global React Context providers and state actions (`context/products-context.tsx`).
- `data/` — Shared TypeScript interfaces, categories, and seed/mock datasets (`data/mock-products.ts`, `data/mock-vendors.ts`).
- `lib/` — Theme tokens (`NAV_THEME`) and utility helpers (`lib/theme.ts`).

## Common Commands
- **Dev server:** `pnpm expo start --dev-client` (append `--tunnel` if testing across separate networks)
- **Type check & diagnostics:** `pnpm tsc --noEmit` and `pnpm dlx expo-doctor`
- **Install dependencies:** `pnpm expo install <package>`
- **Native dev build:** `eas build --profile development --platform android`

## Architecture & Constraints
- **Package Manager (`pnpm`):** Always use `pnpm` (with `node-linker=hoisted` in `.npmrc`). Never run `npm install` or commit a `package-lock.json` alongside `pnpm-lock.yaml`.
- **UI & Styling (React Native Reusables + NativeWind):** Use React Native Reusables primitives from `@/components/ui/*` (`Button`, `Dialog`, `Input`, `Label`, `Text`, `Textarea`, `Badge`, `Separator`) instead of raw React Native components where available so theme tokens and dark/light mode stay consistent.
- **Expo Camera Rules:**
  - Use `CameraView` with `onBarcodeScanned` for real-time video stream barcode scanning without still captures or shutter audio.
  - Set `enableTorch` gated to back camera (`facing === 'back' && torchEnabled`).
  - Zoom range in `expo-camera` is normalized `0` to `1`.
- **Dialogs & Reanimated 4:** Never wrap `<DialogContent>` in `Animated.createAnimatedComponent` (causes missing host instance errors). Strip styles from `DialogContent` and animate an inner `<Animated.View>` card with `marginBottom` driven by `Keyboard` listeners.
- **Generated Files:** Never manually modify `android/`, `ios/`, or `node_modules/`.

## Code Output Preferences
- Show only the specific lines to add, remove, or modify along with their line numbers—do not output entire files unless explicitly requested.
s
- Separate lines to remove and lines to add into distinct blocks instead of using `-` and `+` diff markers.
- When suggesting a new file or folder, always state the exact directory path where it should be created.