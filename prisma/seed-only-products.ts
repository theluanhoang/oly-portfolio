import { prisma } from "../lib/prisma";
import { seedProducts } from "./seed-products";

async function main() {
  try {
    await seedProducts(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Product seed failed:", error);
  process.exit(1);
});


