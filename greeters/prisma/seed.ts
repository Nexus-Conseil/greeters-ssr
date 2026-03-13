import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "../lib/db/prisma";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Greeters Super Admin";

  if (!email || !password) {
    console.log("Seed skipped: define SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the environment.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: UserRole.SUPER_ADMIN,
      passwordHash,
    },
    create: {
      email,
      name,
      role: UserRole.SUPER_ADMIN,
      passwordHash,
    },
  });

  console.log(`Seed complete for ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });