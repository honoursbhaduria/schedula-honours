import { IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../roles.enum';

export class SignupDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}
