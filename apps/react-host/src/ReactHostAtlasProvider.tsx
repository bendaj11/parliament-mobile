import 'es-module-shims';
import type { PropsWithChildren } from 'react';
import type {
  AtlasDeploymentCatalog,
  AtlasHostRuntimeConfig,
} from '@atlas/schema';
import { createBrowserRouter } from 'react-router-dom';
import { initFederation, loadRemoteModule } from '@atlas/sdk/federation';
import { AtlasHostProvider } from '@atlas/runtime/react';
import atlasConfig from '../atlas.config';
import { HostLayout } from './app/HostLayout';

export const router = createBrowserRouter([
  { path: '*', Component: HostLayout },
]);

interface HostProviderProps extends PropsWithChildren {
  runtimeConfig?: AtlasHostRuntimeConfig;
  catalog?: AtlasDeploymentCatalog;
}

export function ReactHostAtlasProvider({
  children,
  runtimeConfig,
  catalog,
}: HostProviderProps) {
  return (
    <AtlasHostProvider
      hostId={atlasConfig.id}
      options={{
        router,
        federation: { initFederation, loadRemoteModule },
        hostData: { hostId: atlasConfig.id, name: atlasConfig.name },
        ...(runtimeConfig ? { runtimeConfig } : {}),
        ...(catalog ? { catalog } : {}),
      }}
    >
      {children}
    </AtlasHostProvider>
  );
}
