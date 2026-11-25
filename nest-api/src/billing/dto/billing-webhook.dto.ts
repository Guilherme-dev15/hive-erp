import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export enum GatewayWebhookEvent {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_DELETED = 'PAYMENT_DELETED',
}

export class BillingWebhookPaymentDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsString()
  billingType?: string;
}

export class BillingWebhookMetadataDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  planCode?: string;

  @IsOptional()
  includeGatewayAddon?: boolean;

  @IsOptional()
  @IsString()
  referenceCode?: string;
}

export class BillingWebhookDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  event: GatewayWebhookEvent | string;

  @IsObject()
  payment: BillingWebhookPaymentDto;

  @IsOptional()
  @IsObject()
  metadata?: BillingWebhookMetadataDto;
}
