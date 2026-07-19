# App source

Required Atlas wiring lives in `src/entry.tsx`, `atlas.config.ts`, and `vite.config.ts`. Keep those files aligned with Atlas docs when changing platform wiring.

Main app component lives in `src/app/App.tsx`. Add screens under feature folders in `src/app`.

When inner routing is enabled, `src/app/routes.tsx` connects app screens to the router. Update it when adding routes.
