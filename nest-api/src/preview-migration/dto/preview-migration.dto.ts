import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PreviewMigrationProductStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export class PreviewMigrationConfigDto {
  @IsString()
  @MaxLength(100)
  storeName!: string;

  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(63)
  slug!: string;
}

export class PreviewMigrationCategoryDto {
  @IsString()
  @MaxLength(128)
  legacyId!: string;

  @IsString()
  @MaxLength(160)
  name!: string;
}

export class PreviewMigrationVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  legacyId?: string;

  @IsString()
  @MaxLength(128)
  skuSuffix!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  adjustmentValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  measurement?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  stock!: number;

  @IsOptional()
  onDemand?: boolean;
}

export class PreviewMigrationProductDto {
  @IsString()
  @MaxLength(128)
  legacyId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  code?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  categoryLegacyId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subcategory?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  imageUrl?: string | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  quantity!: number;

  @IsEnum(PreviewMigrationProductStatus)
  status!: PreviewMigrationProductStatus;
}

export class PreviewMigrationBatchDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{8,100}$/)
  operationId!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,100}$/)
  batchId!: string;

  @ValidateNested()
  @Type(() => PreviewMigrationConfigDto)
  config!: PreviewMigrationConfigDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewMigrationCategoryDto)
  @Max(50)
  categories!: PreviewMigrationCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewMigrationProductDto)
  @Max(50)
  products!: PreviewMigrationProductDto[];
}
