import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Novel, PaginatedResponse } from '../core/novel-api.models';
import { NovelApiService } from '../core/novel-api.service';
import {
  RequestState,
  getErrorMessage,
  initialRequestState,
} from '../core/request-state';

@Component({
  selector: 'app-novel-list-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './novel-list.page.html',
  styleUrl: './novel-list.page.scss',
})
export class NovelListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly novelApi = inject(NovelApiService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(9);
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

    this.novelApi
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
            data: null,
            loading: false,
            error: getErrorMessage(error),
          }),
      });
  }
}
