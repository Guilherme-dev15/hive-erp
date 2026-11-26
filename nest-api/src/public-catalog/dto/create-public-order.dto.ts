import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePublicOrderItemDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(50)
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
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  total?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsIn(['WHATSAPP', 'GATEWAY'])
  paymentMethod?: 'WHATSAPP' | 'GATEWAY';

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
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
  paymentUrl?: string;
  preferenceId?: string;
}
