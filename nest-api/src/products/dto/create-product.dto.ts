import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
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

  @IsOptional()
  status?: any;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  supplierProductUrl?: string;

  @IsString()
  @IsOptional()
  legacyId?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  markup?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  gramPrice?: number;

  @IsString()
  @IsOptional()
  cm?: string;

  @IsString()
  @IsOptional()
  mm?: string;

  @IsOptional()
  variantes?: any[];
}
