import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReaderAuthService } from '../core/reader-auth.service';

@Component({
  selector: 'app-register-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register.page.html',
  styleUrl: './auth.page.scss',
})
export class RegisterPage {
  private readonly auth = inject(ReaderAuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(200)],
    ],
    displayName: ['', [Validators.maxLength(100)]],
  });

  protected submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);

    this.auth
      .register({
        email: value.email,
        password: value.password,
        displayName: value.displayName.trim() || undefined,
      })
      .subscribe({
        next: () => this.router.navigateByUrl(this.getReturnUrl()),
        error: (error) => {
          this.error.set(this.auth.getErrorMessage(error));
          this.submitting.set(false);
        },
      });
  }

  private getReturnUrl() {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');

    if (value?.startsWith('/') && !value.startsWith('//')) {
      return value;
    }

    return '/account';
  }
}
