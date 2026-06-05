import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseEnumPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Role } from './auth/roles.enum';

@Controller('role')
@UseGuards(JwtAuthGuard)
export class RoleController {
  @Get('profile/:role')
  profileByRole(
    @Param('role', new ParseEnumPipe(Role)) role: Role,
    @Req() req: { user?: { username?: string; role?: Role } },
  ) {
    if (req.user?.role !== role) {
      throw new ForbiddenException('Access denied for this role');
    }

    return {
      message: `${role} profile`,
      user: req.user,
    };
  }
}
