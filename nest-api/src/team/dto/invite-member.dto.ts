import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
