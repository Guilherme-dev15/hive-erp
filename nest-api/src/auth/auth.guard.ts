import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    let firebaseUid: string | undefined;
    let firebaseEmail: string | undefined;

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        // Fallback local: UID do admin mockado
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
        throw new UnauthorizedException('Token inválido ou expirado');
      }
    }

    if (!firebaseUid) {
      throw new UnauthorizedException('Não foi possível identificar o usuário');
    }

    // Isolar o Tenant: Buscar o UUID do usuário no PostgreSQL
    // 1. Tenta pelo UID (legacyId)
    // 2. Fallback pelo email, para tratar contas migradas cujo legacyId era o e-mail no script seed
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { legacyId: firebaseUid },
          ...(firebaseEmail ? [{ email: firebaseEmail }] : []),
        ],
      },
    });

    if (!user) {
      // Se o usuário definitivamente não existir na base relacional
      request.user = { legacyId: firebaseUid, id: null };
    } else {
      // Se achou pelo e-mail mas o legacyId não é o UID correto, vamos curar o dado para futuros logins serem mais rápidos
      if (user.legacyId !== firebaseUid && user.email === firebaseEmail) {
        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { legacyId: firebaseUid }
          });
        } catch (e) {
          // Apenas um log de erro silencioso se a cura falhar; não quebra o login
          console.error(`Failed to heal legacyId for user ${user.id}:`, e);
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
