import type { AtlasHostConfig } from '@atlas/schema' with {
  'resolution-mode': 'import',
};

export default {
  type: 'host',
  id: '7ee210f9-dacd-4aac-939e-237032d44740',
  name: 'Angular Host',
  framework: 'angular',
  allowOverrides: true,
} satisfies AtlasHostConfig;
