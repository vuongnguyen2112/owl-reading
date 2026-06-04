import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AdminApiService } from '../core/admin-api.service';
import { Chapter, Novel, PaginatedResponse } from '../core/admin-api.models';
import { RequestState, initialRequestState } from '../core/request-state';

interface ChapterListData {
  novel: Novel;
  chapters: PaginatedResponse<Chapter>;
}

@Component({
  selector: 'app-chapter-list-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterLink,
  ],
  templateUrl: './chapter-list.page.html',
  styleUrl: './chapter-list.page.scss',
})
export class ChapterListPage {
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  protected readonly displayedColumns = [
    'chapterNumber',
    'title',
    'updatedAt',
    'actions',
  ];
  protected readonly novelId = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(100);
  protected readonly state = signal<RequestState<ChapterListData>>(
    initialRequestState(),
  );
  protected readonly novel = computed(() => this.state().data?.novel ?? null);
  protected readonly chapters = computed(
    () => this.state().data?.chapters.items ?? [],
  );
  protected readonly total = computed(
    () => this.state().data?.chapters.total ?? 0,
  );
  protected readonly canDelete = computed(
    () => this.novel()?.status !== 'PUBLISHED',
  );

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const novelId = params.get('novelId') ?? '';
        this.novelId.set(novelId);
        this.loadChapters(novelId);
      });
  }

  protected loadChapters(novelId = this.novelId()) {
    if (!novelId) {
      return;
    }

    this.state.set({ data: this.state().data, loading: true, error: null });

    forkJoin({
      novel: this.adminApi.getNovel(novelId),
      chapters: this.adminApi.listChapters({
        novelId,
        page: this.page(),
        pageSize: this.pageSize(),
      }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.state.set({ data, loading: false, error: null }),
        error: (error) =>
          this.state.set({
            data: this.state().data,
            loading: false,
            error: this.adminApi.getErrorMessage(error),
          }),
      });
  }

  protected deleteChapter(chapter: Chapter) {
    if (!this.canDelete()) {
      return;
    }

    const confirmed = globalThis.confirm(
      `Delete chapter ${chapter.chapterNumber}: "${chapter.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.adminApi
      .deleteChapter(chapter.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadChapters(),
        error: (error) =>
          this.state.set({
            data: this.state().data,
            loading: false,
            error: this.adminApi.getErrorMessage(error),
          }),
      });
  }
}
