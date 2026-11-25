import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SimulateCampaignDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1.0)
  @IsOptional()
  minMarkup?: number;
}

export class ApplyCampaignDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1.0)
  @IsOptional()
  minMarkup?: number;

  @IsString()
  @IsOptional()
  campaignName?: string;
}

export interface CampaignSimulationResponse {
  totalProducts: number;
  affectedProducts: number;
  skippedProducts: number;
  currentRevenue: number;
  projectedRevenue: number;
  currentProfit: number;
  projectedProfit: number;
  currentAvgMarkup: number;
  projectedAvgMarkup: number;
  totalCost: number;
}
