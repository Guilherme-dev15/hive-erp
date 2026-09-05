import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    where: { email: 'guibanks1@gmail.com' },
    data: { legacyId: 'He8p0wAioIctG7ZBIIxG4C9YOmX2' }
  });
  console.log('User updated');
}
main().catch(console.error).finally(() => prisma.$disconnect());
