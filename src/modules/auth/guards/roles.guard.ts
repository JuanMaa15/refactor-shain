import { UserRole } from '@/generated/prisma/enums';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentUser } from '../interfaces/current-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se especificaron roles, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    //Obtener el usuario de la solicitud
    const { user }: { user: CurrentUser } = context.switchToHttp().getRequest();

    // Verificar si el usuario tiene alguno de los roles requeridos
    return requiredRoles.some((role) => user.role.name === role);
  }
}
