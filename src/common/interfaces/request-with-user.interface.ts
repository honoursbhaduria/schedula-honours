import { Request } from 'express';
import { Role } from '../../modules/auth/roles.enum';

export interface UserPayload {
  userId: number;
  email: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}
