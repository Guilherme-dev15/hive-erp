import { IsString, IsNotEmpty, IsOptional, IsEmail, IsUrl } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do fornecedor é obrigatório' })
  name: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  pixKey?: string;

  @IsUrl({}, { message: 'URL inválida' })
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsOptional()
  rules?: any;
}
