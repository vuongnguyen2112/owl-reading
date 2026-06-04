import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminApiService } from '../core/admin-api.service';
import { Chapter, Novel, SaveChapterRequest } from '../core/admin-api.models';
import { RequestState, initialRequestState } from '../core/request-state';

interface ChapterFormData {
  novel: Novel;
  chapter: Chapter | null;
}

@Component({
  selector: 'app-chapter-form-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './chapter-form.page.html',
  styleUrl: './chapter-form.page.scss',
})
export class ChapterFormPage {
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly novelId = signal('');
  protected readonly chapterId = signal('');
  protected readonly saving = signal(false);
  protected readonly state = signal<RequestState<ChapterFormData>>(
    initialRequestState(),
  );
  protected readonly isEditing = computed(() => Boolean(this.chapterId()));
  protected readonly title = signal('');
  protected readonly chapterNumber = signal(1);
  protected readonly content = signal('');

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const novelId = params.get('novelId') ?? '';
        const chapterId = params.get('chapterId') ?? '';
        this.novelId.set(novelId);
        this.chapterId.set(chapterId);
        this.loadForm(novelId, chapterId);
      });
  }

  protected loadForm(novelId = this.novelId(), chapterId = this.chapterId()) {
    if (!novelId) {
      return;
    }

    this.state.set({ data: this.state().data, loading: true, error: null });

    forkJoin({
      novel: this.adminApi.getNovel(novelId),
      chapter: chapterId ? this.adminApi.getChapter(chapterId) : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data.chapter) {
            this.title.set(data.chapter.title);
            this.chapterNumber.set(data.chapter.chapterNumber);
            this.content.set(data.chapter.content);
          }

          this.state.set({ data, loading: false, error: null });
        },
        error: (error) =>
          this.state.set({
            data: null,
            loading: false,
            error: this.adminApi.getErrorMessage(error),
          }),
      });
  }

  protected saveChapter() {
    const request = this.toRequest();

    if (!request.title) {
      this.state.set({
        data: this.state().data,
        loading: false,
        error: 'Title is required.',
      });
      return;
    }

    if (!request.content) {
      this.state.set({
        data: this.state().data,
        loading: false,
        error: 'Content is required.',
      });
      return;
    }

    this.saving.set(true);
    this.state.set({ data: this.state().data, loading: false, error: null });

    const save$ = this.isEditing()
      ? this.adminApi.updateChapter(this.chapterId(), request)
      : this.adminApi.createChapter(request);

    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (chapter) => {
        this.saving.set(false);
        void this.router.navigate([
          '/novels',
          chapter.novelId,
          'chapters',
          chapter.id,
          'edit',
        ]);
      },
      error: (error) => {
        this.saving.set(false);
        this.state.set({
          data: this.state().data,
          loading: false,
          error: this.adminApi.getErrorMessage(error),
        });
      },
    });
  }

  private toRequest(): SaveChapterRequest {
    return {
      novelId: this.novelId(),
      chapterNumber: Number(this.chapterNumber()),
      title: this.title().trim(),
      content: this.content().trim(),
    };
  }
}
