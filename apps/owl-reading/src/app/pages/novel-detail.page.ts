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
  Bookmark,
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
  bookmarks: Bookmark[];
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
  protected readonly canBookmark = computed(() =>
    this.novelApi.isAuthenticated(),
  );
  protected readonly novelBookmark = computed(() => {
    const novel = this.novel();

    if (!novel) {
      return null;
    }

    return (
      this.state().data?.bookmarks.find(
        (bookmark) => bookmark.novelId === novel.id && !bookmark.chapterId,
      ) ?? null
    );
  });

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
          forkJoin({
            progress: this.novelApi
              .getReadingProgress(data.novel.id)
              .pipe(catchError(() => of(null))),
            bookmarks: this.novelApi
              .listBookmarks()
              .pipe(catchError(() => of([]))),
          }).pipe(
            map(({ progress, bookmarks }) => ({
              ...data,
              progress,
              bookmarks,
            })),
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

  protected toggleNovelBookmark() {
    const novel = this.novel();

    if (!novel) {
      return;
    }

    const existingBookmark = this.novelBookmark();

    if (existingBookmark) {
      this.novelApi
        .removeBookmark(existingBookmark.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.removeBookmarkFromState(existingBookmark.id));
      return;
    }

    this.novelApi
      .createBookmark({ novelId: novel.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bookmark) => this.addBookmarkToState(bookmark));
  }

  private addBookmarkToState(bookmark: Bookmark) {
    const current = this.state().data;

    if (!current) {
      return;
    }

    this.state.set({
      data: {
        ...current,
        bookmarks: [
          bookmark,
          ...current.bookmarks.filter((item) => item.id !== bookmark.id),
        ],
      },
      loading: false,
      error: null,
    });
  }

  private removeBookmarkFromState(id: string) {
    const current = this.state().data;

    if (!current) {
      return;
    }

    this.state.set({
      data: {
        ...current,
        bookmarks: current.bookmarks.filter((bookmark) => bookmark.id !== id),
      },
      loading: false,
      error: null,
    });
  }
}
