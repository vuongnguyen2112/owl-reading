import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListNovelsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by novel title.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
