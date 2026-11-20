import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum SuperAdminSubscriptionAction {
  ACTIVATE_MONTHLY = 'ACTIVATE_MONTHLY',
  EXTEND_TRIAL = 'EXTEND_TRIAL',
  GRANT_DAYS = 'GRANT_DAYS',
  SET_EXEMPT = 'SET_EXEMPT',
  EXPIRE_NOW = 'EXPIRE_NOW',
  CANCEL = 'CANCEL',
  SUSPEND_ACCOUNT = 'SUSPEND_ACCOUNT',
  REACTIVATE_ACCOUNT = 'REACTIVATE_ACCOUNT',
}

export class UpdateTenantSubscriptionDto {
  @IsEnum(SuperAdminSubscriptionAction)
  action: SuperAdminSubscriptionAction;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;

  @IsOptional()
  @IsBoolean()
  isExempt?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000000)
  amountCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
