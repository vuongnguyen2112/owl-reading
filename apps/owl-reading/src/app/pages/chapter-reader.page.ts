import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chapter, Novel, PaginatedResponse } from '../core/novel-api.models';
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
    })
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
