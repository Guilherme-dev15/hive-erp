import { IsString, IsOptional, IsNumber, IsEnum, IsDate, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  legacyId?: string;
}
