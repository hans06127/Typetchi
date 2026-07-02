# Coding Rules

- Do not wrap imports in try/catch blocks.
- Content runtime changes must be mirrored in `scripts/content-dist.js` while the packaged extension still copies that file to `dist/content/index.js`.
- Run `npm run typecheck`, `npm run build`, `npm run check:version`, `npm run check:dist`, and `npm run check:storage` before release.
- Never persist runtime-only UI/typing state such as animation flags, speech bubble text, toast state, drag/resize state, composition state, paste maps, or key-hold maps.
- Do not read clipboard text for paste exclusion; only record that a paste event happened.
- Use `chrome.storage.local` wrappers and safe fallbacks for extension-context invalidation.
