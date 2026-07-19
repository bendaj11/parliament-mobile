import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { createRouterOptions, createRoutedApp } from '@atlas/sdk/react';
import { routes } from './app/routes';

export default createRoutedApp({
  createRoot,
  createRouter: ({ context }) =>
    createMemoryRouter(routes, createRouterOptions(context)),
  createElement: (router) => createElement(RouterProvider, { router }),
});
