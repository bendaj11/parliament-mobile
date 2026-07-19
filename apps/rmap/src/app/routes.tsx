import type { RouteObject } from 'react-router-dom';
import { App } from './App';
import { Details } from './details/Details';
import { Home } from './home/Home';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: Home },
      { path: 'details/:id', Component: Details },
    ],
  },
];
