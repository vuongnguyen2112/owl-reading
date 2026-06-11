import { EMPTY, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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

const API_BASE_URL = environment.apiBaseUrl.replace(/\/$/, '');

@Injectable({ providedIn: 'root' })
export class NovelApiService {
  private readonly auth = inject(ReaderAuthService);
  private readonly http = inject(HttpClient);

  listNovels(params: ListNovelsParams = {}) {
    return this.http.get<PaginatedResponse<Novel>>(`${API_BASE_URL}/novels`, {
      params: this.toHttpParams(params),
    });
  }

  getNovel(slug: string) {
    return this.http.get<Novel>(
      `${API_BASE_URL}/novels/${encodeURIComponent(slug)}`,
    );
  }

  listChapters(slug: string, params: ListChaptersParams = {}) {
    return this.http.get<PaginatedResponse<Chapter>>(
      `${API_BASE_URL}/novels/${encodeURIComponent(slug)}/chapters`,
      { params: this.toHttpParams(params) },
    );
  }

  getChapter(slug: string, chapterNumber: number) {
    return this.http.get<Chapter>(
      `${API_BASE_URL}/novels/${encodeURIComponent(slug)}/chapters/${chapterNumber}`,
    );
  }

  getReadingProgress(novelId: string) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return of<ReadingProgress | null>(null);
    }

    return this.http.get<ReadingProgress | null>(
      `${API_BASE_URL}/reading-progress/novels/${encodeURIComponent(novelId)}`,
      { headers },
    );
  }

  saveReadingProgress(request: SaveReadingProgressRequest) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.put<ReadingProgress>(
      `${API_BASE_URL}/reading-progress`,
      request,
      { headers },
    );
  }

  listBookmarks() {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return of<Bookmark[]>([]);
    }

    return this.http.get<Bookmark[]>(`${API_BASE_URL}/bookmarks`, {
      headers,
    });
  }

  createBookmark(request: CreateBookmarkRequest) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.post<Bookmark>(`${API_BASE_URL}/bookmarks`, request, {
      headers,
    });
  }

  removeBookmark(id: string) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.delete<{ success: true }>(
      `${API_BASE_URL}/bookmarks/${encodeURIComponent(id)}`,
      { headers },
    );
  }

  getCurrentUserProfile() {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return of<UserProfile | null>(null);
    }

    return this.http.get<UserProfile>(`${API_BASE_URL}/users/me`, {
      headers,
    });
  }

  updateCurrentUserProfile(request: UpdateUserProfileRequest) {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return EMPTY;
    }

    return this.http.put<UserProfile>(`${API_BASE_URL}/users/me`, request, {
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
