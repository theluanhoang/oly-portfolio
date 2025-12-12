import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const postgresUser = process.env.POSTGRES_USER || 'postgres';
  const postgresPassword = process.env.POSTGRES_PASSWORD || 'postgres';
  const postgresDb = process.env.POSTGRES_DB || 'oly_portfolio';
  const postgresPort = process.env.POSTGRES_PORT || '5432';
  const postgresHost = process.env.POSTGRES_HOST || 'localhost';
  
  return `postgresql://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}?schema=public`;
};

const databaseUrl = getDatabaseUrl();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

