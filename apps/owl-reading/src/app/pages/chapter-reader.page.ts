import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Bookmark,
  Chapter,
  Novel,
  PaginatedResponse,
} from '../core/novel-api.models';
import { NovelApiService } from '../core/novel-api.service';
import {
  RequestState,
  getErrorMessage,
  initialRequestState,
} from '../core/request-state';

interface ChapterReaderData {
  novel: Novel;
  chapter: Chapter;
  chapters: PaginatedResponse<Chapter>;
  bookmarks: Bookmark[];
}

@Component({
  selector: 'app-chapter-reader-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './chapter-reader.page.html',
  styleUrl: './chapter-reader.page.scss',
})
export class ChapterReaderPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly novelApi = inject(NovelApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly slug = signal('');
  protected readonly chapterNumber = signal(1);
  protected readonly state = signal<RequestState<ChapterReaderData>>(
    initialRequestState(),
  );
  protected readonly novel = computed(() => this.state().data?.novel ?? null);
  protected readonly chapter = computed(
    () => this.state().data?.chapter ?? null,
  );
  protected readonly chapters = computed(
    () => this.state().data?.chapters.items ?? [],
  );
  protected readonly previousChapter = computed(() => {
    const current = this.chapterNumber();
    const chapters = this.chapters().filter(
      (chapter) => chapter.chapterNumber < current,
    );

    return chapters.length ? chapters[chapters.length - 1] : null;
  });
  protected readonly nextChapter = computed(() => {
    const current = this.chapterNumber();
    return (
      this.chapters().find((chapter) => chapter.chapterNumber > current) ?? null
    );
  });
  protected readonly paragraphs = computed(
    () =>
      this.chapter()
        ?.content.split(/\n{2,}/)
        .filter(Boolean) ?? [],
  );
  protected readonly canBookmark = computed(() =>
    this.novelApi.isAuthenticated(),
  );
  protected readonly chapterBookmark = computed(() => {
    const chapter = this.chapter();

    if (!chapter) {
      return null;
    }

    return (
      this.state().data?.bookmarks.find(
        (bookmark) => bookmark.chapterId === chapter.id,
      ) ?? null
    );
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params.get('slug') ?? '';
        const chapterNumber = Number(params.get('chapterNumber') ?? 1);

        this.slug.set(slug);
        this.chapterNumber.set(
          Number.isFinite(chapterNumber) ? chapterNumber : 1,
        );
        this.loadChapter(slug, this.chapterNumber());
      });
  }

  protected loadChapter(
    slug = this.slug(),
    chapterNumber = this.chapterNumber(),
  ) {
    if (!slug) {
      return;
    }

    this.state.set({ data: null, loading: true, error: null });

    forkJoin({
      novel: this.novelApi.getNovel(slug),
      chapter: this.novelApi.getChapter(slug, chapterNumber),
      chapters: this.novelApi.listChapters(slug, { page: 1, pageSize: 100 }),
      bookmarks: this.novelApi.listBookmarks().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.state.set({ data, loading: false, error: null });
          this.novelApi
            .saveReadingProgress({
              novelId: data.novel.id,
              chapterId: data.chapter.id,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        },
        error: (error) =>
          this.state.set({
            data: null,
            loading: false,
            error: getErrorMessage(error),
          }),
      });
  }

  protected toggleChapterBookmark() {
    const chapter = this.chapter();

    if (!chapter) {
      return;
    }

    const existingBookmark = this.chapterBookmark();

    if (existingBookmark) {
      this.novelApi
        .removeBookmark(existingBookmark.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.removeBookmarkFromState(existingBookmark.id));
      return;
    }

    this.novelApi
      .createBookmark({ chapterId: chapter.id })
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
