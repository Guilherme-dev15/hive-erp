import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SetupBatchTier } from '@prisma/client';

export class CreateCheckoutIntentDto {
  @IsOptional()
  @IsEnum(SetupBatchTier)
  setupBatchTier?: SetupBatchTier;

  @IsOptional()
  @IsBoolean()
  includeGatewayAddon?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceDescription?: string;
}
