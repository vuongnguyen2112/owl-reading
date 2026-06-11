import { loadRuntimeConfig } from '@owl-reading/shared-utils';
import { environment } from './environments/environment';

loadRuntimeConfig({ fallbackApiBaseUrl: environment.apiBaseUrl })
  .then(async () => {
    const [{ bootstrapApplication }, { appConfig }, { App }] =
      await Promise.all([
        import('@angular/platform-browser'),
        import('./app/app.config'),
        import('./app/app'),
      ]);

    return bootstrapApplication(App, appConfig);
  })
  .catch((err) => console.error(err));
