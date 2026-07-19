import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import type { AtlasHostClientEntry } from '@atlas/sdk/lifecycle';
import { ReactHostAtlasProvider, router } from './ReactHostAtlasProvider';
import './styles.css';

export const mount: AtlasHostClientEntry['mount'] = (request) => {
  const element = (
    <StrictMode>
      <ReactHostAtlasProvider
        runtimeConfig={request.runtimeConfig}
        catalog={request.catalog}
      >
        <RouterProvider router={router} />
      </ReactHostAtlasProvider>
    </StrictMode>
  );
  const root = createRoot(request.container);
  root.render(element);
  return { unmount: () => root.unmount() };
};
