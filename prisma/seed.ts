import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Master paket
  const paket1 = await prisma.package.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, packageName: "Home 10 Mbps", bandwidth: "10M/10M", price: 150000 },
  });
  const paket2 = await prisma.package.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, packageName: "Home 20 Mbps", bandwidth: "20M/20M", price: 250000 },
  });
  const paket3 = await prisma.package.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, packageName: "Biz 50 Mbps", bandwidth: "50M/50M", price: 450000 },
  });

  // Pelanggan contoh
  const c1 = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Budi Santoso",
      whatsapp: "628123456789",
      ipAddress: "192.168.1.10",
      packageId: paket1.id,
      dueDateDay: 5,
      status: "active",
    },
  });
  const c2 = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Siti Rahayu",
      whatsapp: "628123456790",
      ipAddress: "192.168.1.11",
      packageId: paket2.id,
      dueDateDay: 10,
      status: "active",
    },
  });
  const c3 = await prisma.customer.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "Joko Widodo",
      whatsapp: "628123456791",
      ipAddress: "192.168.1.12",
      packageId: paket3.id,
      dueDateDay: 15,
      status: "active",
    },
  });

  const period = new Date().toISOString().slice(0, 7).replace(/^(\d{4})-(\d{2}).*$/, "$1-$2");
  for (const c of [c1, c2, c3]) {
    const paket = await prisma.package.findUnique({ where: { id: c.packageId } });
    await prisma.invoice.upsert({
      where: { customerId_billingPeriod: { customerId: c.id, billingPeriod: period } },
      update: {},
      create: {
        customerId: c.id,
        billingPeriod: period,
        amount: paket?.price ?? 0,
        status: c.id === 1 ? "paid" : "unpaid",
        paidAt: c.id === 1 ? new Date() : null,
      },
    });
  }

  // Admin user default
  const adminEmail = "admin@pencatatanwifi.local";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Administrator",
        email: adminEmail,
        password: await bcrypt.hash("admin123", 12),
        role: "admin",
      },
    });
    console.log("Admin user dibuat: email=admin@pencatatanwifi.local, password=admin123");
  }

  console.log("Seed selesai: paket, pelanggan, tagihan & admin user telah dibuat.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
