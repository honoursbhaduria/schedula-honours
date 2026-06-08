import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from './roles.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('JwtStrategy');

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  validate(payload: JwtPayload) {
    this.logger.debug(`Validating payload: ${JSON.stringify(payload)}`);
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
