import { Injectable } from '@nestjs/common';
import { Role } from '../auth/roles.enum';

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: Role;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [];
  private nextId = 1;

  findByUsername(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }

  create(username: string, passwordHash: string, role: Role): User {
    const user: User = {
      id: this.nextId,
      username,
      passwordHash,
      role,
    };

    this.users.push(user);
    this.nextId += 1;

    return user;
  }
}
