# Typetchi Architecture (v0.9.0)

## Runtime / build source of truth

- `scripts/content-dist.js` is the current content-script runtime source of truth for the packaged Chrome extension.
- `npm run build` runs `scripts/build-dist.mjs`, copies `scripts/content-dist.js` to `dist/content/index.js`, writes `dist/manifest.json` with the `package.json` version, and copies popup files.
- The actual extension runtime path loaded by `manifest.json` / `dist/manifest.json` is `dist/content/index.js`.
- `src/` remains the typed React/module implementation reference. Any content runtime behavior change must be mirrored in `scripts/content-dist.js` until the build is migrated to bundle `src/content/index.tsx` directly.
- Runtime freshness is checked by the `Typetchi runtime v0.9.0` marker in `dist/content/index.js` via `npm run check:dist` / `npm run check:runtime`.

## Storage schema and migration

Storage is kept in `chrome.storage.local` and normalized after read. Current schema version is `1`, stored at `typetchi.schemaVersion`.

| Key | Purpose | Persisted | Cross-tab sync | Daily reset | Runtime-only |
| --- | --- | --- | --- | --- | --- |
| `typetchi.schemaVersion` | Storage schema version marker | Yes | No UI sync needed | No | No |
| `typetchi.petState` | EXP, level, stage, daily typed count, daily max speed | Yes | Yes | Daily counters reset by `lastActiveDate` | No |
| `typetchi.widgetState` | Widget x/y/size, pinned, collapsed, closed | Yes | Yes | No | No |
| `typetchi.dailyMissions` | Mission progress, completion, reward claimed flags | Yes | Yes | Yes, by date key | No |
| `typetchi.settings` | User/dev settings | Yes | Yes | No | No |
| `typetchi.typingStats` | Reserved persisted stats key | Yes | Yes | Yes where date-scoped | No |

Runtime-only state must not be written to storage: animation state, speech bubble text, EXP toast amount, drag/resize flags, IME composition flag, key-hold maps, paste detection map, and recent typing event windows.

## State flow and cross-tab sync

Local updates mutate in-memory state, schedule debounced storage writes, and render. Remote updates from `chrome.storage.onChanged` run inside the remote-update path and only update memory/render; they do not schedule a second write. Timestamps (`updatedAt`) prevent older changes from replacing newer in-memory state.

Daily mission rewards are guarded by each mission's `completed` / `rewardClaimed` flags, so an already-completed remote mission is rendered but not rewarded again.

## Effective input rules

Typetchi counts only effective hand-typed input. It ignores sensitive/untrackable fields, readonly/disabled targets, paste events, large instant input events, IME composition intermediate input, non-positive input deltas, and since v0.9.0 long auto-repeat key holds. If one key is held for more than 1.5 seconds, subsequent repeat-generated input events from the same target are ignored for EXP, daily missions, today typed count, CPM/WPM, sessions, and typing feedback. The key-hold state is runtime-only and uses keyboard metadata rather than typed content.

## Dev mode

Dev controls are only available when dev mode is enabled by the existing runtime shortcut/local setting path. Keep dev actions on normal EXP/evolution flows: Add EXP calls the same EXP path, and Set Stage must keep `currentStage` / `currentEvolutionNodeId` equivalent state consistent.

## Error handling

Storage access is guarded so extension-context invalidation or unavailable `chrome.storage` disables future storage access for the page and falls back to in-memory state. Widget state is normalized after reads and before writes to prevent off-viewport positions. Root reinjection keeps the widget alive on SPA root rebuilds without breaking the host page.
