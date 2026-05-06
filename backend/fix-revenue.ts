import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activeEnrollments = await prisma.enrollment.findMany({
    where: { status: 'active' },
  });

  let updated = 0;
  for (const en of activeEnrollments) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        courseId: en.courseId,
        order: { userId: en.userId, status: { in: ['pending', 'processing'] } },
      },
      include: { order: true },
    });

    for (const item of orderItems) {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status: 'paid' },
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} old orders to paid.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
