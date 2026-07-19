import { initFederation } from '@atlas/sdk/federation';

void initFederation()
  .then(() => import('./bootstrap'))
  .then(({ bootstrap }) => bootstrap())
  .catch((error) =>
    console.error(
      'Atlas host failed to start:',
      error instanceof Error ? error.message : String(error),
      'Suggested action: Fix reported federation, host configuration, or resource failure, then reload host.',
    ),
  );
