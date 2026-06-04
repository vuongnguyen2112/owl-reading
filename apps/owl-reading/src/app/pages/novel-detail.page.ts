import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Chapter,
  Novel,
  PaginatedResponse,
  ReadingProgress,
} from '../core/novel-api.models';
import { NovelApiService } from '../core/novel-api.service';
import {
  RequestState,
  getErrorMessage,
  initialRequestState,
} from '../core/request-state';

interface NovelDetailData {
  novel: Novel;
  chapters: PaginatedResponse<Chapter>;
  progress: ReadingProgress | null;
}

@Component({
  selector: 'app-novel-detail-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './novel-detail.page.html',
  styleUrl: './novel-detail.page.scss',
})
export class NovelDetailPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly novelApi = inject(NovelApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly slug = signal('');
  protected readonly state = signal<RequestState<NovelDetailData>>(
    initialRequestState(),
  );
  protected readonly novel = computed(() => this.state().data?.novel ?? null);
  protected readonly chapters = computed(
    () => this.state().data?.chapters.items ?? [],
  );
  protected readonly startChapterNumber = computed(
    () =>
      this.state().data?.progress?.chapterNumber ??
      this.chapters()[0]?.chapterNumber ??
      1,
  );
  protected readonly startReadingLabel = computed(() =>
    this.state().data?.progress ? 'Continue reading' : 'Start reading',
  );

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.slug.set(slug);
      this.loadNovel(slug);
    });
  }

  protected loadNovel(slug = this.slug()) {
    if (!slug) {
      return;
    }

    this.state.set({ data: null, loading: true, error: null });

    forkJoin({
      novel: this.novelApi.getNovel(slug),
      chapters: this.novelApi.listChapters(slug, { page: 1, pageSize: 100 }),
    })
      .pipe(
        switchMap((data) =>
          this.novelApi.getReadingProgress(data.novel.id).pipe(
            map((progress) => ({ ...data, progress })),
            catchError(() => of({ ...data, progress: null })),
          ),
        ),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.state.set({ data, loading: false, error: null }),
        error: (error) =>
          this.state.set({
            data: null,
            loading: false,
            error: getErrorMessage(error),
          }),
      });
  }
}
