import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { getRuntimeApiBaseUrl } from '@owl-reading/shared-utils';
import {
  Chapter,
  ListChaptersParams,
  ListNovelsParams,
  Novel,
  PaginatedResponse,
  SaveChapterRequest,
  SaveNovelRequest,
} from './admin-api.models';
import { environment } from '../../environments/environment';
import { AdminAuthService } from './admin-auth.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly auth = inject(AdminAuthService);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = getRuntimeApiBaseUrl(environment.apiBaseUrl);

  listNovels(params: ListNovelsParams = {}) {
    return this.http.get<PaginatedResponse<Novel>>(
      `${this.apiBaseUrl}/admin/novels`,
      {
        headers: this.getAuthHeaders(),
        params: this.toHttpParams(params),
      },
    );
  }

  getNovel(id: string) {
    return this.http.get<Novel>(
      `${this.apiBaseUrl}/admin/novels/${encodeURIComponent(id)}`,
      { headers: this.getAuthHeaders() },
    );
  }

  createNovel(request: SaveNovelRequest) {
    return this.http.post<Novel>(`${this.apiBaseUrl}/admin/novels`, request, {
      headers: this.getAuthHeaders(),
    });
  }

  updateNovel(id: string, request: SaveNovelRequest) {
    return this.http.patch<Novel>(
      `${this.apiBaseUrl}/admin/novels/${encodeURIComponent(id)}`,
      request,
      { headers: this.getAuthHeaders() },
    );
  }

  deleteNovel(id: string) {
    return this.http.delete<Novel>(
      `${this.apiBaseUrl}/admin/novels/${encodeURIComponent(id)}`,
      { headers: this.getAuthHeaders() },
    );
  }

  listChapters(params: ListChaptersParams = {}) {
    return this.http.get<PaginatedResponse<Chapter>>(
      `${this.apiBaseUrl}/admin/chapters`,
      {
        headers: this.getAuthHeaders(),
        params: this.toHttpParams(params),
      },
    );
  }

  getChapter(id: string) {
    return this.http.get<Chapter>(
      `${this.apiBaseUrl}/admin/chapters/${encodeURIComponent(id)}`,
      { headers: this.getAuthHeaders() },
    );
  }

  createChapter(request: SaveChapterRequest) {
    return this.http.post<Chapter>(`${this.apiBaseUrl}/admin/chapters`, request, {
      headers: this.getAuthHeaders(),
    });
  }

  updateChapter(id: string, request: SaveChapterRequest) {
    return this.http.patch<Chapter>(
      `${this.apiBaseUrl}/admin/chapters/${encodeURIComponent(id)}`,
      request,
      { headers: this.getAuthHeaders() },
    );
  }

  deleteChapter(id: string) {
    return this.http.delete<Chapter>(
      `${this.apiBaseUrl}/admin/chapters/${encodeURIComponent(id)}`,
      { headers: this.getAuthHeaders() },
    );
  }

  isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  getErrorMessage(error: unknown) {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Something went wrong.';
    }

    if (error.status === 401) {
      return 'You must sign in with an admin account.';
    }

    if (error.status === 403) {
      return 'Your account does not have admin access.';
    }

    if (error.status === 409) {
      return (
        this.getServerMessage(error) ??
        'This action conflicts with the current content state.'
      );
    }

    return this.getServerMessage(error) ?? 'The admin API request failed.';
  }

  private getAuthHeaders() {
    const token = this.auth.getAccessToken();

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  private getServerMessage(error: HttpErrorResponse) {
    const value = error.error as { message?: unknown } | null;

    if (typeof value?.message === 'string') {
      return value.message;
    }

    if (Array.isArray(value?.message)) {
      return value.message.join(' ');
    }

    return null;
  }

  private toHttpParams(params: ListNovelsParams | ListChaptersParams) {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return httpParams;
  }
}
