import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdminApiService } from '../core/admin-api.service';
import { Novel, PaginatedResponse } from '../core/admin-api.models';
import { RequestState, initialRequestState } from '../core/request-state';

@Component({
  selector: 'app-novel-list-page',
  imports: [
    FormsModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    RouterLink,
  ],
  templateUrl: './novel-list.page.html',
  styleUrl: './novel-list.page.scss',
})
export class NovelListPage {
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly displayedColumns = [
    'title',
    'slug',
    'status',
    'updatedAt',
    'actions',
  ];
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly search = signal('');
  protected readonly state = signal<RequestState<PaginatedResponse<Novel>>>(
    initialRequestState(),
  );
  protected readonly novels = computed(() => this.state().data?.items ?? []);
  protected readonly total = computed(() => this.state().data?.total ?? 0);
  protected readonly hasPreviousPage = computed(() => this.page() > 1);
  protected readonly hasNextPage = computed(
    () => this.page() * this.pageSize() < this.total(),
  );
  protected readonly hasAuthToken = computed(() =>
    this.adminApi.isAuthenticated(),
  );

  constructor() {
    this.loadNovels();
  }

  protected applySearch() {
    this.page.set(1);
    this.loadNovels();
  }

  protected clearSearch() {
    this.search.set('');
    this.applySearch();
  }

  protected goToPreviousPage() {
    if (!this.hasPreviousPage()) {
      return;
    }

    this.page.update((page) => page - 1);
    this.loadNovels();
  }

  protected goToNextPage() {
    if (!this.hasNextPage()) {
      return;
    }

    this.page.update((page) => page + 1);
    this.loadNovels();
  }

  protected loadNovels() {
    this.state.set({ data: this.state().data, loading: true, error: null });

    this.adminApi
      .listNovels({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search().trim() || undefined,
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

  protected deleteNovel(novel: Novel) {
    if (novel.status === 'PUBLISHED') {
      return;
    }

    const confirmed = globalThis.confirm(
      `Delete "${novel.title}"? This permanently removes the novel and its chapters.`,
    );

    if (!confirmed) {
      return;
    }

    this.adminApi
      .deleteNovel(novel.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadNovels(),
        error: (error) =>
          this.state.set({
            data: this.state().data,
            loading: false,
            error: this.adminApi.getErrorMessage(error),
          }),
      });
  }
}
