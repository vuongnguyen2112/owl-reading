import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'novels',
    pathMatch: 'full',
  },
  {
    path: 'novels',
    loadComponent: () =>
      import('./pages/novel-list.page').then((module) => module.NovelListPage),
  },
  {
    path: 'novels/new',
    loadComponent: () =>
      import('./pages/novel-form.page').then((module) => module.NovelFormPage),
  },
  {
    path: 'novels/:id/edit',
    loadComponent: () =>
      import('./pages/novel-form.page').then((module) => module.NovelFormPage),
  },
  {
    path: 'novels/:novelId/chapters',
    loadComponent: () =>
      import('./pages/chapter-list.page').then(
        (module) => module.ChapterListPage,
      ),
  },
  {
    path: 'novels/:novelId/chapters/new',
    loadComponent: () =>
      import('./pages/chapter-form.page').then(
        (module) => module.ChapterFormPage,
      ),
  },
  {
    path: 'novels/:novelId/chapters/:chapterId/edit',
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
