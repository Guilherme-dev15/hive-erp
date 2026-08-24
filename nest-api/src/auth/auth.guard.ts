import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    let firebaseUid: string | undefined;

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        // Fallback local: UID do admin mockado
        firebaseUid = 'He8p0wAioIctG7ZBIIxG4C9YOmX2';
      } else {
        throw new UnauthorizedException('Token não fornecido');
      }
    } else if (token === 'mock-token' && process.env.NODE_ENV !== 'production') {
      firebaseUid = 'He8p0wAioIctG7ZBIIxG4C9YOmX2';
    } else {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
      } catch (error) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }
    }

    if (!firebaseUid) {
      throw new UnauthorizedException('Não foi possível identificar o usuário');
    }

    // Isolar o Tenant: Buscar o UUID do usuário no PostgreSQL baseado no UID do Firebase (legacyId)
    const user = await this.prisma.user.findUnique({
      where: { legacyId: firebaseUid },
    });

    if (!user) {
      // Se não encontrar o usuário no Postgres, podemos injetar apenas o legacyId
      // ou negar o acesso dependendo da fase de migração.
      // Para o Dual Write, precisamos permitir que os endpoints aceitem o legacyId e busquem/criem se necessário.
      request.user = { legacyId: firebaseUid, id: null };
    } else {
      request.user = { id: user.id, legacyId: user.legacyId };
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
