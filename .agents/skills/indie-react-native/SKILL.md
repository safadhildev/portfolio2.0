---
name: indie-react-native
description: >
  React Native / Expo implementation playbook. Use when building or fixing UI, navigation, or native
  integration in a React Native app. Covers performance pitfalls, platform-parity traps, and 2026
  New Architecture / Hermes defaults.
---

# React Native / Expo playbook

## Stack detection

Confirm before assuming: Expo (managed/bare) vs bare RN CLI, navigation library (React Navigation vs
Expo Router), state approach already in use (Zustand/Redux/Context), and RN version (New Architecture
is default since 0.76; the old bridge was retired in 0.82; Hermes V1 is default since 0.84).

## Performance (highest-signal pitfalls)

- **Never `.map()` a large array into JSX.** Use FlashList (preferred, recycles views) or FlatList for
  anything list-like over ~20 items.
- **Stable props into lists** — inline arrow functions in JSX create a new reference every render,
  defeating `React.memo` on list items. Hoist or `useCallback` them.
- **Memoize pure list-item components** with `React.memo`.
- Use React DevTools Profiler to find components re-rendering too often before optimizing blindly.
- Check bundle size with a bundle visualizer if startup feels slow.

## Upgrade checklist

After any RN version bump or `expo prebuild`/native regeneration, explicitly re-verify Hermes and New
Architecture flags in `ios/Podfile` and `android/gradle.properties` — they can silently reset, and the
app keeps running on the old engine with no error.

## Platform parity

- Test/verify iOS vs Android separately for anything touching permissions, safe-area insets, or a
  native module — behavior differences here are common and not obvious from code alone.
- Don't assume a permission flow or native API behaves identically on both platforms.

## UI/UX

- Every screen needs loading/empty/error states, not just the happy path.
- Respect safe-area insets and platform-native navigation gestures.
- See `indie-uiux` for accessibility (screen-reader labels, touch target size, contrast).

## Release (see `indie-cicd` for full pipeline detail)

- Generate build/version numbers in CI, not from a local counter.
- Verify signing-key fingerprint before a release build.

## Verification

`expo doctor` / `pnpm|yarn|npm typecheck` (tsc) / the project's test command. Manually trace the golden
path on at least one platform if no simulator/device is available for both.
