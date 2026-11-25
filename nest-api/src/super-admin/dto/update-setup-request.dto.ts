import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SetupRequestStatus } from '@prisma/client';

export class UpdateSetupRequestDto {
  @IsEnum(SetupRequestStatus)
  status: SetupRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  importedCount?: number;

  @IsOptional()
  @IsBoolean()
  activateMonthlyPlanToo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  monthlyDays?: number;
}
