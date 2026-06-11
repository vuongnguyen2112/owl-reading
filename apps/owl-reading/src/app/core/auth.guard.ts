import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ReaderAuthService } from './reader-auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(ReaderAuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
