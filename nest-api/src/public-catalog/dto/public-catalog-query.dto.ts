import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PublicCatalogQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase letters, numbers, and single hyphens',
  })
  slug?: string;
}
