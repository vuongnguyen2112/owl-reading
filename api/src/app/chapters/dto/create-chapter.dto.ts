import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateChapterDto {
  @ApiProperty()
  @IsUUID()
  novelId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  chapterNumber!: number;

  @ApiProperty({ example: 'The Brass Feather' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content!: string;
}
