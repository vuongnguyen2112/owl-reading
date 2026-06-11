import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_AUTH_REFRESH } from './auth-http-context';

const API_BASE_URL = environment.apiBaseUrl.replace(/\/$/, '');
const ACCESS_TOKEN_STORAGE_KEY = 'owl_access_token';

export interface AdminAuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: 'USER' | 'ADMIN';
}

export interface AdminAuthResponse {
  user: AdminAuthUser;
  accessToken: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly accessToken = signal(this.readAccessToken());
  private readonly user = signal<AdminAuthUser | null>(null);

  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));
  readonly currentUser = this.user.asReadonly();

  login(request: AdminLoginRequest) {
    return this.http
      .post<AdminAuthResponse>(`${API_BASE_URL}/auth/login`, request, {
        context: this.skipRefreshContext(),
        withCredentials: true,
      })
      .pipe(tap((response) => this.storeAdminSession(response)));
  }

  hydrate() {
    if (!this.accessToken()) {
      return;
    }

    this.http
      .get<AdminAuthUser>(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.accessToken()}` },
      })
      .subscribe({
        next: (user) => {
          if (user.role !== 'ADMIN') {
            this.clearSession();
            return;
          }

          this.user.set(user);
        },
        error: () => this.clearSession(),
      });
  }

  refreshAccessToken() {
    return this.http
      .post<AdminAuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          context: this.skipRefreshContext(),
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => this.storeAdminSession(response)),
        tap({
          error: () => this.clearSession(),
        }),
        map((response) => response.accessToken),
      );
  }

  logout() {
    return this.http
      .post<{ success: true }>(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          context: this.skipRefreshContext(),
          withCredentials: true,
        },
      )
      .pipe(finalize(() => this.clearSession()));
  }

  getAccessToken() {
    return this.accessToken();
  }

  clearSession() {
    this.accessToken.set('');
    this.user.set(null);
    globalThis.sessionStorage?.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  getErrorMessage(error: unknown) {
    if (!(error instanceof HttpErrorResponse)) {
      if (error instanceof Error) {
        return error.message;
      }

      return 'Something went wrong. Please try again.';
    }

    if (error.status === 0) {
      return 'Could not reach the API. Please try again.';
    }

    if (error.status === 401) {
      return 'Invalid email or password.';
    }

    if (error.status === 403) {
      return 'Your account does not have admin access.';
    }

    const message = (error.error as { message?: unknown } | null)?.message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    return 'The login request failed.';
  }

  private storeAdminSession(response: AdminAuthResponse) {
    if (response.user.role !== 'ADMIN') {
      this.clearSession();
      throw new Error('Your account does not have admin access.');
    }

    this.accessToken.set(response.accessToken);
    this.user.set(response.user);
    globalThis.sessionStorage?.setItem(
      ACCESS_TOKEN_STORAGE_KEY,
      response.accessToken,
    );
  }

  private readAccessToken() {
    return globalThis.sessionStorage?.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? '';
  }

  private skipRefreshContext() {
    return new HttpContext().set(SKIP_AUTH_REFRESH, true);
  }
}
