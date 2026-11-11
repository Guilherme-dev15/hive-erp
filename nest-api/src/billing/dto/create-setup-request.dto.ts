import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SetupBatchTier } from '@prisma/client';

export class CreateSetupRequestDto {
  @IsEnum(SetupBatchTier)
  batchTier: SetupBatchTier;

  @IsOptional()
  @IsBoolean()
  includeMonthlyPlan?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceDescription?: string;
}
