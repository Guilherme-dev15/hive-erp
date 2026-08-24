import { IsString, IsOptional, IsNumber, IsEnum, Min, IsArray, ValidateNested, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class CreateOrderItemDto {
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

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

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

  @IsBoolean()
  @IsOptional()
  financialRegistered?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  legacyId?: string;
}
