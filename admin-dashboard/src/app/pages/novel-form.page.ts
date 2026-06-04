import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AdminApiService } from '../core/admin-api.service';
import { Novel, NovelStatus, SaveNovelRequest } from '../core/admin-api.models';
import { RequestState, initialRequestState } from '../core/request-state';

@Component({
  selector: 'app-novel-form-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './novel-form.page.html',
  styleUrl: './novel-form.page.scss',
})
export class NovelFormPage {
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly statuses: NovelStatus[] = [
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
  ];
  protected readonly id = signal('');
  protected readonly saving = signal(false);
  protected readonly state = signal<RequestState<Novel>>(initialRequestState());
  protected readonly isEditing = computed(() => Boolean(this.id()));
  protected readonly title = signal('');
  protected readonly slug = signal('');
  protected readonly description = signal('');
  protected readonly coverImageUrl = signal('');
  protected readonly status = signal<NovelStatus>('DRAFT');

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id') ?? '';
        this.id.set(id);

        if (id) {
          this.loadNovel(id);
        }
      });
  }

  protected loadNovel(id = this.id()) {
    if (!id) {
      return;
    }

    this.state.set({ data: this.state().data, loading: true, error: null });

    this.adminApi
      .getNovel(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (novel) => {
          this.title.set(novel.title);
          this.slug.set(novel.slug);
          this.description.set(novel.description ?? '');
          this.coverImageUrl.set(novel.coverImageUrl ?? '');
          this.status.set(novel.status);
          this.state.set({ data: novel, loading: false, error: null });
        },
        error: (error) =>
          this.state.set({
            data: null,
            loading: false,
            error: this.adminApi.getErrorMessage(error),
          }),
      });
  }

  protected saveNovel() {
    const request = this.toRequest();

    if (!request.title) {
      this.state.set({
        data: this.state().data,
        loading: false,
        error: 'Title is required.',
      });
      return;
    }

    this.saving.set(true);
    this.state.set({ data: this.state().data, loading: false, error: null });

    const save$ = this.isEditing()
      ? this.adminApi.updateNovel(this.id(), request)
      : this.adminApi.createNovel(request);

    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (novel) => {
        this.saving.set(false);
        void this.router.navigate(['/novels', novel.id, 'edit']);
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

  private toRequest(): SaveNovelRequest {
    return {
      title: this.title().trim(),
      slug: this.slug().trim() || undefined,
      description: this.description().trim() || undefined,
      coverImageUrl: this.coverImageUrl().trim() || undefined,
      status: this.status(),
    };
  }
}
