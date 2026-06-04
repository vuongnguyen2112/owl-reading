import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListChaptersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter admin chapter list by novel id.',
  })
  @IsOptional()
  @IsUUID()
  novelId?: string;
}
