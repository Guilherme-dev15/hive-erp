import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';

export function ensureFirebaseApp(): void {
  if (getApps().length === 0) {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'hive-1874c';
    initializeApp({ projectId });
  }
}

export const KNOWN_ADMIN_EMAILS = [
  'guibanks1@gmail.com',
  'guilherme.macedo1598@gmail.com',
];

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return Array.from(new Set([...KNOWN_ADMIN_EMAILS, ...envEmails]));
}

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
        ensureFirebaseApp();
        const decodedToken = await getAuth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        firebaseEmail = decodedToken.email;
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn('Fallback AuthGuard Local - Token Firebase Inválido mas aceito para simular dev.');
          firebaseUid = 'He8p0wAioIctG7ZBIIxG4C9YOmX2';
          firebaseEmail = 'guibanks1@gmail.com';
        } else {
          this.logger.error('Erro na validação do token Firebase:', error instanceof Error ? error.message : error);
          throw new UnauthorizedException('Token inválido ou expirado');
        }
      }
    }

    if (!firebaseUid) {
      throw new UnauthorizedException('Não foi possível identificar o usuário');
    }

    const normalizedEmail = firebaseEmail?.trim().toLowerCase();
    const adminEmails = getAdminEmails();
    const isAdmin = Boolean(normalizedEmail && adminEmails.includes(normalizedEmail));

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { legacyId: firebaseUid },
          ...(normalizedEmail
            ? [{ email: { equals: normalizedEmail, mode: 'insensitive' as const } }]
            : []),
        ],
      },
      include: { config: true },
    });

    if (!user && isAdmin) {
      // Procura admin/owner existente para reconciliar
      const existingOwner = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { in: adminEmails, mode: 'insensitive' as const } },
            { role: 'OWNER' },
          ],
        },
        include: { config: true },
      });

      if (existingOwner) {
        try {
          user = await this.prisma.user.update({
            where: { id: existingOwner.id },
            data: {
              legacyId: firebaseUid,
              email: normalizedEmail!,
              role: 'OWNER',
              active: true,
            },
            include: { config: true },
          });
          this.logger.log(`Linked existing owner ${existingOwner.id} to admin ${normalizedEmail} (UID: ${firebaseUid})`);
        } catch (linkErr) {
          user = await this.prisma.user.update({
            where: { id: existingOwner.id },
            data: {
              legacyId: firebaseUid,
              role: 'OWNER',
              active: true,
            },
            include: { config: true },
          });
          this.logger.log(`Linked existing owner ${existingOwner.id} legacyId only to UID ${firebaseUid}`);
        }
      } else {
        // Cold start - auto-provisionar conta admin com loja 'hive'
        try {
          user = await this.prisma.user.create({
            data: {
              email: normalizedEmail!,
              name: 'Guilherme Macedo',
              role: 'OWNER',
              active: true,
              legacyId: firebaseUid,
              config: {
                create: {
                  storeName: 'Hive Pratas',
                  publicSlug: 'hive',
                  primaryColor: '#D4AF37',
                  secondaryColor: '#343434',
                },
              },
            },
            include: { config: true },
          });
          this.logger.log(`Auto-provisioned cold-start admin user ${user.id} (${normalizedEmail}) with store 'hive'`);
        } catch (createErr) {
          user = await this.prisma.user.create({
            data: {
              email: normalizedEmail!,
              name: 'Guilherme Macedo',
              role: 'OWNER',
              active: true,
              legacyId: firebaseUid,
              config: {
                create: {
                  storeName: 'Hive Pratas',
                },
              },
            },
            include: { config: true },
          });
          this.logger.log(`Auto-provisioned cold-start admin user ${user.id} (${normalizedEmail}) without slug`);
        }
      }
    }

    if (user) {
      // Se legacyId estiver desatualizado, curar no PostgreSQL
      const userEmailNormalized = user.email?.trim().toLowerCase();
      if (user.legacyId !== firebaseUid && normalizedEmail && userEmailNormalized === normalizedEmail) {
        try {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { legacyId: firebaseUid },
            include: { config: true },
          });
          this.logger.log(`Healed legacyId for user ${user.id} (${normalizedEmail})`);
        } catch (e) {
          this.logger.error(`Failed to heal legacyId for user ${user.id}:`, e instanceof Error ? e.stack : e);
        }
      }

      // Se for admin, garantir role OWNER e active true
      if (isAdmin && (!user.active || user.role !== 'OWNER')) {
        try {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { active: true, role: 'OWNER' },
            include: { config: true },
          });
          this.logger.log(`Ensured OWNER/active status for admin user ${user.id}`);
        } catch (e) {
          this.logger.warn(`Failed to update admin role/active for ${user.id}:`, e);
        }
      }

      // Se usuário não possuir registro de Config, auto-criar
      if (!user.config) {
        try {
          try {
            await this.prisma.config.create({
              data: {
                userId: user.id,
                storeName: 'Hive Pratas',
                publicSlug: isAdmin ? 'hive' : undefined,
              },
            });
          } catch {
            await this.prisma.config.create({
              data: {
                userId: user.id,
                storeName: 'Hive Pratas',
              },
            });
          }
          this.logger.log(`Auto-created missing config for user ${user.id}`);
        } catch (cfgErr) {
          this.logger.warn(`Failed to auto-create config for user ${user.id}:`, cfgErr);
        }
      }

      request.user = { id: user.id, legacyId: firebaseUid };
    } else {
      request.user = { legacyId: firebaseUid, id: null };
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
