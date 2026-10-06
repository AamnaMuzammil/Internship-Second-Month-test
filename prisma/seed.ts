import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@salon.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@salon.com',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: Role.ADMIN,
    },
  });

  if ((await prisma.service.count()) > 0) return;

  const haircut = await prisma.service.create({
    data: { name: 'Haircut', description: 'Classic haircut', durationMin: 60, price: 25 },
  });
  const coloring = await prisma.service.create({
    data: { name: 'Hair Coloring', description: 'Full color', durationMin: 60, price: 60 },
  });
  const facial = await prisma.service.create({
    data: { name: 'Facial', description: 'Cleansing facial', durationMin: 45, price: 40 },
  });

  const sara = await prisma.staff.create({
    data: { name: 'Sara', services: { create: [{ serviceId: haircut.id }, { serviceId: coloring.id }] } },
  });
  const ali = await prisma.staff.create({
    data: { name: 'Ali', services: { create: [{ serviceId: haircut.id }, { serviceId: facial.id }] } },
  });

  const slots: { staffId: number; startTime: Date; endTime: Date }[] = [];
  for (const staff of [sara, ali]) {
    for (let d = 1; d <= 3; d++) {
      for (let h = 10; h < 17; h++) {
        const start = new Date();
        start.setDate(start.getDate() + d);
        start.setHours(h, 0, 0, 0);
        const end = new Date(start);
        end.setHours(h + 1);
        slots.push({ staffId: staff.id, startTime: start, endTime: end });
      }
    }
  }
  await prisma.timeSlot.createMany({ data: slots, skipDuplicates: true });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());