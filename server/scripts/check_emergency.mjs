import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  const workers = await prisma.user.findMany({
    where: { emergenciesEnabled: true },
    select: { id: true, name: true, email: true, telegramChatId: true, emergenciesEnabled: true }
  });
  console.log('=== Workers con emergenciesEnabled true ===');
  console.log(JSON.stringify(workers, null, 2));
  console.log('Total:', workers.length);

  const tgUsers = await prisma.user.findMany({
    where: { telegramChatId: { not: null } },
    select: { id: true, name: true, telegramChatId: true }
  });
  console.log('\n=== Usuarios con telegramChatId seteado ===');
  console.log(JSON.stringify(tgUsers, null, 2));

  const allUsers = await prisma.user.findMany({
    take: 5,
    select: { id: true, name: true, email: true, role: true, emergenciesEnabled: true, telegramChatId: true }
  });
  console.log('\n=== Primeros 5 usuarios ===');
  console.log(JSON.stringify(allUsers, null, 2));
} finally {
  await prisma.$disconnect();
}
