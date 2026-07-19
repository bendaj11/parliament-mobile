import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ReactHostAtlasProvider, router } from './ReactHostAtlasProvider';
import './styles.css';

const root = document.getElementById('root');
if (!root)
  throw new Error(
    'Atlas React host root was not found. Suggested action: Add <div id="root"></div> to host index.html, then reload.',
  );

const reactRoot = createRoot(root);
flushSync(() =>
  reactRoot.render(
    <StrictMode>
      <ReactHostAtlasProvider>
        <RouterProvider router={router} />
      </ReactHostAtlasProvider>
    </StrictMode>,
  ),
);
