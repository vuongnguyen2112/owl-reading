import { EMPTY, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Chapter,
  ListChaptersParams,
  ListNovelsParams,
  Novel,
  PaginatedResponse,
  ReadingProgress,
  SaveReadingProgressRequest,
} from './novel-api.models';
import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl.replace(/\/$/, '');
const ACCESS_TOKEN_STORAGE_KEY = 'owl_access_token';

@Injectable({ providedIn: 'root' })
export class NovelApiService {
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
    const token = globalThis.sessionStorage?.getItem(ACCESS_TOKEN_STORAGE_KEY);

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : null;
  }
}
