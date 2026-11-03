import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePublicOrderItemDto {
  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salePrice: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class CreatePublicOrderDto {
  @IsString()
  slug: string;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  total: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePublicOrderItemDto)
  items: CreatePublicOrderItemDto[];
}

export interface PublicOrderResponse {
  success: boolean;
  orderId: string;
  status: string;
  total: number;
  createdAt: Date;
}
