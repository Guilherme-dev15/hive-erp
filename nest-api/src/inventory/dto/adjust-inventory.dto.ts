import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum AdjustType {
  ENTRY = 'entry',
  EXIT = 'exit'
}

export class AdjustInventoryDto {
  @IsEnum(AdjustType, { message: 'O tipo deve ser entry ou exit' })
  type: AdjustType | 'entry' | 'exit';

  @IsInt()
  @Min(1, { message: 'A quantidade deve ser maior que 0' })
  quantity: number;

  @IsString()
  @IsOptional()
  userName?: string;
}
