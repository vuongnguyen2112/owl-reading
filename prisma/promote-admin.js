require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_PROMOTION !== 'true') {
  throw new Error(
    'Refusing to promote an admin in production without ALLOW_ADMIN_PROMOTION=true.',
  );
}

if (!connectionString) {
  throw new Error('DATABASE_URL is required to promote an admin user.');
}

if (!email) {
  throw new Error('ADMIN_EMAIL is required to promote an admin user.');
}

const databaseUrl = new URL(connectionString);
const schema = databaseUrl.searchParams.get('schema') ?? undefined;

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString, { schema }),
  log: ['warn', 'error'],
});

async function main() {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(`Promoted ${user.email} (${user.id}) to ${user.role}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
