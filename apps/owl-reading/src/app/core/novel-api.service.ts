import { EMPTY, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { getRuntimeApiBaseUrl } from '@owl-reading/shared-utils';
import {
  Bookmark,
  Chapter,
  CreateBookmarkRequest,
  ListChaptersParams,
  ListNovelsParams,
  Novel,
  PaginatedResponse,
  ReadingProgress,
  SaveReadingProgressRequest,
  UpdateUserProfileRequest,
  UserProfile,
} from './novel-api.models';
import { environment } from '../../environments/environment';
import { ReaderAuthService } from './reader-auth.service';

@Injectable({ providedIn: 'root' })
export class NovelApiService {
  private readonly auth = inject(ReaderAuthService);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = getRuntimeApiBaseUrl(environment.apiBaseUrl);

  listNovels(params: ListNovelsParams = {}) {
    return this.http.get<PaginatedResponse<Novel>>(`${this.apiBaseUrl}/novels`, {
      params: this.toHttpParams(params),
    });
  }

  getNovel(slug: string) {
    return this.http.get<Novel>(
      `${this.apiBaseUrl}/novels/${encodeURIComponent(slug)}`,
    );
  }

  listChapters(slug: string, params: ListChaptersParams = {}) {
    return this.http.get<PaginatedResponse<Chapter>>(
      `${this.apiBaseUrl}/novels/${encodeURIComponent(slug)}/chapters`,
      { params: this.toHttpParams(params) },
    );
  }

  getChapter(slug: string, chapterNumber: number) {
    return this.http.get<Chapter>(
      `${this.apiBaseUrl}/novels/${encodeURIComponent(slug)}/chapters/${chapterNumber}`,
    );
  }

  getReadingProgress(novelId: string) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return of<ReadingProgress | null>(null);
    }

    return this.http.get<ReadingProgress | null>(
      `${this.apiBaseUrl}/reading-progress/novels/${encodeURIComponent(novelId)}`,
      { headers },
    );
  }

  saveReadingProgress(request: SaveReadingProgressRequest) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.put<ReadingProgress>(
      `${this.apiBaseUrl}/reading-progress`,
      request,
      { headers },
    );
  }

  listBookmarks() {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return of<Bookmark[]>([]);
    }

    return this.http.get<Bookmark[]>(`${this.apiBaseUrl}/bookmarks`, {
      headers,
    });
  }

  createBookmark(request: CreateBookmarkRequest) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.post<Bookmark>(`${this.apiBaseUrl}/bookmarks`, request, {
      headers,
    });
  }

  removeBookmark(id: string) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.delete<{ success: true }>(
      `${this.apiBaseUrl}/bookmarks/${encodeURIComponent(id)}`,
      { headers },
    );
  }

  getCurrentUserProfile() {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return of<UserProfile | null>(null);
    }

    return this.http.get<UserProfile>(`${this.apiBaseUrl}/users/me`, {
      headers,
    });
  }

  updateCurrentUserProfile(request: UpdateUserProfileRequest) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.put<UserProfile>(`${this.apiBaseUrl}/users/me`, request, {
      headers,
    });
  }

  isAuthenticated() {
    return this.auth.isAuthenticated();
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

  private getAuthHeaders() {
    const token = this.auth.getAccessToken();

    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : null;
  }
}
