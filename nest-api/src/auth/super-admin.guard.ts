import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { getAdminEmails } from './auth.guard';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (request?.method === 'OPTIONS') {
      return true;
    }

    const user = request?.user;
    if (!user?.id) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    const normalizedEmail = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const adminEmails = getAdminEmails();

    if (user.isSuperAdmin !== true || !normalizedEmail || !adminEmails.includes(normalizedEmail)) {
      throw new ForbiddenException('Acesso restrito ao administrador da plataforma');
    }

    return true;
  }
}
