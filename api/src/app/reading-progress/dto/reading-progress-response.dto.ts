import { ApiProperty } from '@nestjs/swagger';

export class ReadingProgressResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  novelId!: string;

  @ApiProperty()
  novelSlug!: string;

  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  chapterNumber!: number;

  @ApiProperty()
  lastReadAt!: Date;
}
