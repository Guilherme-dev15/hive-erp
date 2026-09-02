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

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        firebaseUid = 'He8p0wAioIctG7ZBIIxG4C9YOmX2';
        firebaseEmail = 'guibanks1@gmail.com';
      } else {
        throw new UnauthorizedException('Token não fornecido');
      }
    } else if (token === 'mock-token' && process.env.NODE_ENV !== 'production') {
      firebaseUid = 'He8p0wAioIctG7ZBIIxG4C9YOmX2';
      firebaseEmail = 'guibanks1@gmail.com';
    } else {
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        firebaseEmail = decodedToken.email;
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn('Fallback AuthGuard Local - Token Firebase Inválido mas aceito para simular dev.');
          firebaseUid = 'He8p0wAioIctG7ZBIIxG4C9YOmX2';
          firebaseEmail = 'guibanks1@gmail.com';
        } else {
          throw new UnauthorizedException('Token inválido ou expirado');
        }
      }
    }

    if (!firebaseUid) {
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
      request.user = { legacyId: firebaseUid, id: null };
    } else {
      if (user.legacyId !== firebaseUid && user.email === firebaseEmail) {
        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { legacyId: firebaseUid }
          });
          this.logger.log(`Healed legacyId for user ${user.id} (${firebaseEmail})`);
        } catch (e) {
          this.logger.error(`Failed to heal legacyId for user ${user.id}:`, e instanceof Error ? e.stack : e);
        }
      }
      
      request.user = { id: user.id, legacyId: firebaseUid };
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
