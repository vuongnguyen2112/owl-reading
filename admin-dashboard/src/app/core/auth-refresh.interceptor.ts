import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AUTH_REFRESH_RETRIED, SKIP_AUTH_REFRESH } from './auth-http-context';
import { AdminAuthService } from './admin-auth.service';

export const authRefreshInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        request.context.get(SKIP_AUTH_REFRESH) ||
        request.context.get(AUTH_REFRESH_RETRIED) ||
        !auth.isAuthenticated()
      ) {
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((accessToken) =>
          next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${accessToken}` },
              context: request.context.set(AUTH_REFRESH_RETRIED, true),
            }),
          ),
        ),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          void router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
