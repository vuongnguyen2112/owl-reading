import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NovelApiService } from '../core/novel-api.service';
import { Novel, PaginatedResponse } from '../core/novel-api.models';
import {
  RequestState,
  getErrorMessage,
  initialRequestState,
} from '../core/request-state';

@Component({
  selector: 'app-home-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly novelApi = inject(NovelApiService);

  protected readonly state = signal<RequestState<PaginatedResponse<Novel>>>(
    initialRequestState(),
  );
  protected readonly novels = computed(() => this.state().data?.items ?? []);
  protected readonly featuredNovel = computed(() => this.novels()[0] ?? null);
  protected readonly remainingNovels = computed(() => this.novels().slice(1));

  constructor() {
    this.loadNovels();
  }

  protected loadNovels() {
    this.state.set({ data: null, loading: true, error: null });

    this.novelApi
      .listNovels({ page: 1, pageSize: 6 })
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
