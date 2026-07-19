import { Location } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { initFederation, loadRemoteModule } from '@atlas/sdk/federation';
import type { AtlasHostClientEntry } from '@atlas/sdk/lifecycle';
import { startHost } from '@atlas/runtime/angular';
import atlasConfig from '../atlas.config';
import { AppComponent } from './app/app.component';
import { AtlasHostDefaultRouteComponent } from './app/atlas-host-default-route.component';

type HostMountRequest = Parameters<AtlasHostClientEntry['mount']>[0];

export async function bootstrap(request?: HostMountRequest) {
  const root = request ? document.createElement('atlas-host-root') : undefined;
  if (root && request) request.container.append(root);
  const app = await bootstrapApplication(AppComponent, {
    providers: [
      provideRouter([
        { path: '**', component: AtlasHostDefaultRouteComponent },
      ]),
    ],
  });

  const runtime = await startHost({
    router: app.injector.get(Router),
    location: app.injector.get(Location),
    federation: { initFederation, loadRemoteModule },
    hostData: { hostId: atlasConfig.id, name: atlasConfig.name },
    ...(request
      ? { runtimeConfig: request.runtimeConfig, catalog: request.catalog }
      : {}),
  });
  return {
    async unmount() {
      await runtime.stop();
      app.destroy();
      root?.remove();
    },
  };
}
