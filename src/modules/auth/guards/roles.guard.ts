import { UserRole } from '@/generated/prisma/enums';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    /* const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',

    ) */
  }
}
