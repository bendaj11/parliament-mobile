import type { AtlasHostConfig } from '@atlas/schema' with {
  'resolution-mode': 'import',
};

export default {
  type: 'host',
  id: '63f23aaa-ad0a-4a6a-ad2d-0feb6354ee8d',
  name: 'React Host',
  framework: 'react',
  allowCustomOverrides: true,
} satisfies AtlasHostConfig;
