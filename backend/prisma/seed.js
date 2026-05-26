import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = [
  {
    name: 'developer',
    description: 'Standard user — can read, navigate, search, annotate, and use AI features.',
  },
  {
    name: 'admin',
    description: 'Administrative access — manage users, roles, and platform settings.',
  },
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log(`Seeded ${ROLES.length} roles: ${ROLES.map((r) => r.name).join(', ')}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
