# App source

Required Atlas wiring lives in `src/entry.ts`, `atlas.config.ts`, and `federation.config.js`. Keep those files aligned with Atlas docs when changing platform wiring.

Main app component lives in `src/app/app.component.ts`. Add screens under feature folders in `src/app`.

When inner routing is enabled, `src/app/routes.ts` connects app screens to the router. Update it when adding routes.
