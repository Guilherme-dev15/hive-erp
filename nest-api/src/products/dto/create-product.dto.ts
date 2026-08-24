import { IsString, IsOptional, IsNumber, IsEnum, Min, IsUrl, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salePrice: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  marginPercent?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  weight?: number;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsUrl()
  @IsOptional()
  supplierProductUrl?: string;

  @IsString()
  @IsOptional()
  legacyId?: string;
}
