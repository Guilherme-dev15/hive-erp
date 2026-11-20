import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_SUBSCRIPTION_CHECK_KEY } from './skip-subscription-check.decorator';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request?.method === 'OPTIONS') {
      return true;
    }

    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCheck) {
      return true;
    }

    const user = request?.user;
    if (!user?.id) {
      throw new UnauthorizedException('Usuário não provisionado no ERP');
    }

    if (user.isSuperAdmin === true) {
      return true;
    }

    const access = await this.subscriptionService.getAccessStatus(user.id, false);
    if (access.isBlocked) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Payment Required',
          code: 'SUBSCRIPTION_EXPIRED',
          message:
            'Seu período de teste ou assinatura expirou. Regularize o plano na tela de Assinatura para retomar o acesso ao painel.',
          subscription: access,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
