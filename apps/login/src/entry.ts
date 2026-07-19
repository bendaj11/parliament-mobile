import 'zone.js';
import { LocationStrategy } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  createLocationStrategy,
  defineApp,
  provideAtlasAppContext,
  provideAtlasSdk,
} from '@atlas/sdk/angular';
import { routes } from './app/routes';
import { AppComponent } from './app/app.component';

export default defineApp(async ({ container, sdk, context }) => {
  const element = document.createElement('atlas-login-root');
  const locationStrategy = createLocationStrategy(context);

  container.append(element);

  const app = await bootstrapApplication(AppComponent, {
    providers: [
      provideRouter(routes),
      provideAtlasAppContext(context),
      provideAtlasSdk(sdk),
      { provide: LocationStrategy, useValue: locationStrategy },
    ],
  });

  return {
    unmount() {
      app.destroy();
      locationStrategy.ngOnDestroy();
      element.remove();
    },
  };
});
