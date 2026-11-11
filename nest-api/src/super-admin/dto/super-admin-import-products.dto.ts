import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class SuperAdminImportProductsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  products: Record<string, any>[];

  @IsOptional()
  @IsUUID()
  setupRequestId?: string;
}
