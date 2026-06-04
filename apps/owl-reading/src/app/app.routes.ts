import { Route } from '@angular/router';

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
    path: 'account',
    loadComponent: () =>
      import('./pages/account.page').then((module) => module.AccountPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
