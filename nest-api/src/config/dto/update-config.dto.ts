import { IsOptional, IsString, IsNumber, Min, IsObject } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyGoal?: number;

  @IsOptional()
  @IsObject()
  banners?: any;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cardFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  packagingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  warrantyText?: string;
}
