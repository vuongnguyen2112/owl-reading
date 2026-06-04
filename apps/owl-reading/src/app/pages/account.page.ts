import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserProfile } from '../core/novel-api.models';
import { NovelApiService } from '../core/novel-api.service';
import {
  RequestState,
  getErrorMessage,
  initialRequestState,
} from '../core/request-state';

@Component({
  selector: 'app-account-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './account.page.html',
  styleUrl: './account.page.scss',
})
export class AccountPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly novelApi = inject(NovelApiService);

  protected readonly displayName = signal('');
  protected readonly saved = signal(false);
  protected readonly saving = signal(false);
  protected readonly state = signal<RequestState<UserProfile>>(
    initialRequestState(),
  );
  protected readonly profile = computed(() => this.state().data);
  protected readonly isAuthenticated = computed(() =>
    this.novelApi.isAuthenticated(),
  );

  constructor() {
    this.loadProfile();
  }

  protected loadProfile() {
    this.saved.set(false);

    if (!this.novelApi.isAuthenticated()) {
      this.state.set({ data: null, loading: false, error: null });
      return;
    }

    this.state.set({ data: this.state().data, loading: true, error: null });

    this.novelApi
      .getCurrentUserProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.displayName.set(profile?.displayName ?? '');
          this.state.set({ data: profile, loading: false, error: null });
        },
        error: (error) =>
          this.state.set({
            data: null,
            loading: false,
            error: getErrorMessage(error),
          }),
      });
  }

  protected saveProfile() {
    if (!this.novelApi.isAuthenticated()) {
      return;
    }

    this.saving.set(true);
    this.saved.set(false);

    this.novelApi
      .updateCurrentUserProfile({
        displayName: this.displayName().trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.displayName.set(profile.displayName ?? '');
          this.state.set({ data: profile, loading: false, error: null });
          this.saving.set(false);
          this.saved.set(true);
        },
        error: (error) => {
          this.state.set({
            data: this.state().data,
            loading: false,
            error: getErrorMessage(error),
          });
          this.saving.set(false);
        },
      });
  }
}
