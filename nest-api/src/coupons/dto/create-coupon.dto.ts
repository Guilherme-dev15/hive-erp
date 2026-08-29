import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  discountPercent: number;
}
