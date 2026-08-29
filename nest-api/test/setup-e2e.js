const { PrismaClient } = require('@prisma/client');

jest.setTimeout(30000);

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
