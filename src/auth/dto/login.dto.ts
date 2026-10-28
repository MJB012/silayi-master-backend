import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // Accepts email or mobile number

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
