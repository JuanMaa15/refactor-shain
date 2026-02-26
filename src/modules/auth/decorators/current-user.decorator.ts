import { User } from '@/generated/prisma/client';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser as CurrentUserInterface } from '@/modules/auth/interfaces/index';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const { user }: { user: CurrentUserInterface } = ctx
      .switchToHttp()
      .getRequest();

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
