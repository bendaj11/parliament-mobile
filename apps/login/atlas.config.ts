import type { AtlasAppConfig } from '@atlas/schema' with {
  'resolution-mode': 'import',
};

export default {
  type: 'app',
  id: 'b793d518-ee46-43cb-a57c-e0bcf85043c9',
  name: 'Login',
  framework: 'angular',
  routes: [
    {
      hostId: '7ee210f9-dacd-4aac-939e-237032d44740',
      basePath: '/login',
      title: 'Login',
      nav: { label: 'Login', visible: true },
    },
    {
      hostId: '63f23aaa-ad0a-4a6a-ad2d-0feb6354ee8d',
      basePath: '/login',
      title: 'Login',
      nav: { label: 'Login', visible: true },
    },
  ],
} satisfies AtlasAppConfig;
