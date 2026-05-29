import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany().then(users => {
  console.log("USERS:", users);
}).catch(console.error).finally(() => prisma.$disconnect());
