const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const id = 'test-user-id';
    console.log('Testing User Upsert...');
    const user = await prisma.user.upsert({
      where: { id },
      create: { id, settings: '{}' },
      update: {}
    });
    console.log('User Upsert Success:', user);

    console.log('Testing User Update...');
    const updated = await prisma.user.update({
      where: { id },
      data: { settings: JSON.stringify({ debridKey: 'success' }) }
    });
    console.log('User Update Success:', updated);

  } catch (err) {
    console.error('Prisma Test Failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
