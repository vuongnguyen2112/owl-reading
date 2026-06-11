import { Route } from '@angular/router';
import { adminAuthGuard } from './core/admin-auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login.page').then((module) => module.LoginPage),
  },
  {
    path: '',
    redirectTo: 'novels',
    pathMatch: 'full',
  },
  {
    path: 'novels',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/novel-list.page').then((module) => module.NovelListPage),
  },
  {
    path: 'novels/new',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/novel-form.page').then((module) => module.NovelFormPage),
  },
  {
    path: 'novels/:id/edit',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/novel-form.page').then((module) => module.NovelFormPage),
  },
  {
    path: 'novels/:novelId/chapters',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/chapter-list.page').then(
        (module) => module.ChapterListPage,
      ),
  },
  {
    path: 'novels/:novelId/chapters/new',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/chapter-form.page').then(
        (module) => module.ChapterFormPage,
      ),
  },
  {
    path: 'novels/:novelId/chapters/:chapterId/edit',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/chapter-form.page').then(
        (module) => module.ChapterFormPage,
      ),
  },
  {
    path: '**',
    redirectTo: 'novels',
  },
];
