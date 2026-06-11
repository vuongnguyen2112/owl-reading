import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NovelApiService } from '../core/novel-api.service';
import { NovelDetailPage } from './novel-detail.page';

describe('NovelDetailPage', () => {
  it('shows an empty chapter state without a start link', async () => {
    const novelApi = {
      getNovel: vi.fn().mockReturnValue(
        of({
          id: 'novel-id',
          title: 'The Clockwork Owl',
          slug: 'the-clockwork-owl',
          description: null,
          coverImageUrl: null,
          status: 'PUBLISHED',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
      ),
      listChapters: vi.fn().mockReturnValue(
        of({
          items: [],
          total: 0,
          page: 1,
          pageSize: 100,
        }),
      ),
      getReadingProgress: vi.fn().mockReturnValue(of(null)),
      listBookmarks: vi.fn().mockReturnValue(of([])),
      isAuthenticated: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [NovelDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'the-clockwork-owl' })),
          },
        },
        { provide: NovelApiService, useValue: novelApi },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NovelDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const linkText = Array.from(compiled.querySelectorAll('a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(compiled.textContent).toContain('No chapters available yet.');
    expect(compiled.textContent).not.toContain('Start reading');
    expect(compiled.textContent).not.toContain('Continue reading');
    expect(linkText).not.toContain('Start reading');
    expect(linkText).not.toContain('Continue reading');
  });
});
