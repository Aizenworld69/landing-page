import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInstructorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
