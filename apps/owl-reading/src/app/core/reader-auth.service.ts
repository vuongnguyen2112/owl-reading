import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_AUTH_REFRESH } from './auth-http-context';

const API_BASE_URL = environment.apiBaseUrl.replace(/\/$/, '');
const ACCESS_TOKEN_STORAGE_KEY = 'owl_access_token';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName?: string;
}

@Injectable({ providedIn: 'root' })
export class ReaderAuthService {
  private readonly http = inject(HttpClient);
  private readonly accessToken = signal(this.readAccessToken());
  private readonly user = signal<AuthUser | null>(null);

  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));
  readonly currentUser = this.user.asReadonly();

  login(request: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, request, {
        context: this.skipRefreshContext(),
        withCredentials: true,
      })
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(request: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, request, {
        context: this.skipRefreshContext(),
        withCredentials: true,
      })
      .pipe(tap((response) => this.storeSession(response)));
  }

  hydrate() {
    if (!this.accessToken()) {
      return;
    }

    this.http
      .get<AuthUser>(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.accessToken()}` },
      })
      .subscribe({
        next: (user) => this.user.set(user),
        error: () => this.clearSession(),
      });
  }

  refreshAccessToken() {
    return this.http
      .post<AuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          context: this.skipRefreshContext(),
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => this.storeSession(response)),
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
      return 'Something went wrong. Please try again.';
    }

    if (error.status === 0) {
      return 'Could not reach the API. Please try again.';
    }

    const message = (error.error as { message?: unknown } | null)?.message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (error.status === 429) {
      return 'Too many attempts. Please wait and try again.';
    }

    return 'The authentication request failed.';
  }

  private storeSession(response: AuthResponse) {
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
