import { Route } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home.page').then((module) => module.HomePage),
  },
  {
    path: 'novels',
    loadComponent: () =>
      import('./pages/novel-list.page').then((module) => module.NovelListPage),
  },
  {
    path: 'novels/:slug',
    loadComponent: () =>
      import('./pages/novel-detail.page').then(
        (module) => module.NovelDetailPage,
      ),
  },
  {
    path: 'novels/:slug/chapters/:chapterNumber',
    loadComponent: () =>
      import('./pages/chapter-reader.page').then(
        (module) => module.ChapterReaderPage,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register.page').then((module) => module.RegisterPage),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/account.page').then((module) => module.AccountPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
