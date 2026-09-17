import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    let firebaseUid: string | undefined;
    let firebaseEmail: string | undefined;

    if (request.method === 'OPTIONS') {
       return true;
    }

    const allowMockAuth =
      process.env.ALLOW_MOCK_AUTH === 'true' && process.env.VERCEL !== '1';

    if (!token) {
      if (allowMockAuth) {
        firebaseUid = process.env.MOCK_FIREBASE_UID;
        firebaseEmail = process.env.MOCK_FIREBASE_EMAIL;
      } else {
        throw new UnauthorizedException('Token não fornecido');
      }
    } else if (token === 'mock-token' && allowMockAuth) {
      firebaseUid = process.env.MOCK_FIREBASE_UID;
      firebaseEmail = process.env.MOCK_FIREBASE_EMAIL;
    } else {
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        firebaseEmail = decodedToken.email;
      } catch {
        throw new UnauthorizedException('Token inválido ou expirado');
      }
    }

    if (!firebaseUid || !firebaseEmail) {
      throw new UnauthorizedException('Não foi possível identificar o usuário');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { legacyId: firebaseUid },
          ...(firebaseEmail ? [{ email: firebaseEmail }] : []),
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Registro do usuário não encontrado no banco de dados da plataforma.'
      );
    }

    if (user.legacyId !== firebaseUid && user.email === firebaseEmail) {
      try {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { legacyId: firebaseUid },
        });
        this.logger.log(`Healed legacyId for user ${user.id} (${firebaseEmail})`);
      } catch (e) {
        this.logger.error(
          `Failed to heal legacyId for user ${user.id}:`,
          e instanceof Error ? e.stack : e
        );
      }
    }

    request.user = { id: user.id, legacyId: firebaseUid };

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
