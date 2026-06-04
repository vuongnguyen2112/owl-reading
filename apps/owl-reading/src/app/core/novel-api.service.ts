import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Chapter,
  ListChaptersParams,
  ListNovelsParams,
  Novel,
  PaginatedResponse,
} from './novel-api.models';
import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl.replace(/\/$/, '');

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
