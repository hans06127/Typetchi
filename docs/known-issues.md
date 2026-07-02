# Known Issues

- The packaged content runtime is still the hand-maintained `scripts/content-dist.js`; `src/content/index.tsx` is not yet bundled directly into `dist/content/index.js`. Until that migration is done, runtime behavior changes must be kept in sync manually and verified with `npm run check:dist`.
- Chrome Extension management page version must be verified manually after loading `dist/`; automated checks can only confirm `package.json`, `manifest.json`, and `dist/manifest.json`.
