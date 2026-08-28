import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class BulkMarkupDto {
  @IsString()
  categoryId: string; // no firebase era o nome, no postgres idealmente é o categoryId (UUID) ou legacyId

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  markup: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  globalGramPrice?: number; // Permite forçar um preço da grama na atualização, sanando a dívida de gramPrice por produto
}

export class BulkStatusDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[]; // Pode ser o UUID do Prisma ou o ID legado do Firebase

  @IsEnum(ProductStatus)
  status: ProductStatus;
}
