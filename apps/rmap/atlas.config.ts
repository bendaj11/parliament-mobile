import type { AtlasAppConfig } from '@atlas/schema' with {
  'resolution-mode': 'import',
};

export default {
  type: 'app',
  id: '26c17794-f347-4a68-8cd3-9f2a4265e6ba',
  name: 'Rmap',
  framework: 'react',
  routes: [
    {
      hostId: '7ee210f9-dacd-4aac-939e-237032d44740',
      basePath: '/rmap',
      title: 'Rmap',
      nav: { label: 'Rmap', visible: true },
    },
    {
      hostId: '63f23aaa-ad0a-4a6a-ad2d-0feb6354ee8d',
      basePath: '/rmap',
      title: 'Rmap',
      nav: { label: 'Rmap', visible: true },
    },
  ],
} satisfies AtlasAppConfig;
