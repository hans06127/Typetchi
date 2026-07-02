# Changelog

## v0.9.0

- Bumped package and manifest version to `0.9.0`.
- Documented the current runtime path: `scripts/content-dist.js` is copied to `dist/content/index.js` by `npm run build`.
- Added runtime freshness checks for the `Typetchi runtime v0.9.0` marker.
- Added storage schema version key documentation and check coverage.
- Added runtime-only long-key-hold exclusion: repeat input after holding the same key for more than 1.5 seconds no longer counts for EXP, missions, typing stats, sessions, or typing feedback.
- Preserved paste exclusion and IME composition safeguards.
