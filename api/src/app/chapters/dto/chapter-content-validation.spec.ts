import { validate } from 'class-validator';
import { CHAPTER_CONTENT_MAX_LENGTH } from './chapter-content-limits';
import { CreateChapterDto } from './create-chapter.dto';
import { UpdateChapterDto } from './update-chapter.dto';

describe('chapter content validation', () => {
  it('allows generous chapter content for create requests', async () => {
    const dto = new CreateChapterDto();
    dto.novelId = '5a4d420e-9782-4234-b1b1-583ba61114c6';
    dto.chapterNumber = 1;
    dto.title = 'A Long Chapter';
    dto.content = 'a'.repeat(CHAPTER_CONTENT_MAX_LENGTH);

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects oversized chapter content for create requests', async () => {
    const dto = new CreateChapterDto();
    dto.novelId = '5a4d420e-9782-4234-b1b1-583ba61114c6';
    dto.chapterNumber = 1;
    dto.title = 'Too Long';
    dto.content = 'a'.repeat(CHAPTER_CONTENT_MAX_LENGTH + 1);

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });

  it('rejects oversized chapter content for update requests', async () => {
    const dto = new UpdateChapterDto();
    dto.content = 'a'.repeat(CHAPTER_CONTENT_MAX_LENGTH + 1);

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });
});
