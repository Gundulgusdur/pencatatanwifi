"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth, getCurrentUser } from "@/lib/auth";

export type CustomerRow = {
  id: number;
  name: string;
  whatsapp: string;
  ipAddress: string | null;
  packageId: number;
  packageName: string | null;
  packagePrice: number | null;
  dueDateDay: number;
  status: string;
};

export type InvoiceRow = {
  id: number;
  customerId: number;
  customerName: string;
  customerWhatsapp: string | null;
  billingPeriod: string;
  amount: number;
  status: string;
  paidAt: Date | null;
};

function currentPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/* ---------- Dashboard ---------- */

export async function getDashboardStats() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const period = `${y}-${m}`;

  const [totalCustomers, activeCustomers, unpaidInvoices, revenueThisMonth] =
    await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: "active" } }),
      prisma.invoice.aggregate({
        where: { billingPeriod: period, status: "unpaid" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { billingPeriod: period, status: "paid" },
        _sum: { amount: true },
      }),
    ]);

  const potential = Number(unpaidInvoices._sum.amount ?? 0);
  const revenue = Number(revenueThisMonth._sum.amount ?? 0);

  return {
    totalCustomers,
    activeCustomers,
    unpaidCount: unpaidInvoices._count ?? 0,
    unpaidPotential: potential,
    revenueThisMonth: revenue,
  };
}

export async function getRevenueChart() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const rows = await prisma.invoice.groupBy({
    by: ["billingPeriod"],
    where: {
      status: "paid",
      billingPeriod: { in: months },
    },
    _sum: { amount: true },
  });

  const map = new Map(
    rows.map((r) => [r.billingPeriod, Number(r._sum.amount ?? 0)])
  );

  return months.map((p) => ({ period: p, revenue: map.get(p) ?? 0 }));
}

export async function getRecentActivity(limit = 10) {
  const invoices = await prisma.invoice.findMany({
    take: limit,
    orderBy: { paidAt: { sort: "desc", nulls: "last" } },
    include: { customer: true },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    time: inv.paidAt ?? new Date(),
    customer: inv.customer.name,
    ip: inv.customer.ipAddress ?? "-",
    package: (inv.customer as { package?: { packageName: string | null } | null })
      .package?.packageName ?? "-",
    status: inv.status,
    amount: inv.amount,
  }));
}

export async function getSystemStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { database: "online", app: "online" };
  } catch {
    return { database: "offline", app: "online" };
  }
}

/* ---------- Customers ---------- */

export async function listCustomers(): Promise<CustomerRow[]> {
  const rows = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { package: true },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    ipAddress: r.ipAddress,
    packageId: r.packageId,
    packageName: r.package?.packageName ?? null,
    packagePrice: r.package ? Number(r.package.price) : null,
    dueDateDay: r.dueDateDay,
    status: r.status,
  }));
}

export async function listPackages() {
  return prisma.package.findMany({ orderBy: { packageName: "asc" } });
}

export async function createCustomer(data: {
  name: string;
  whatsapp: string;
  ipAddress?: string | null;
  packageId: number;
  dueDateDay: number;
  status?: string;
}) {
  await requireAuth();
  return prisma.customer.create({
    data: {
      name: data.name,
      whatsapp: data.whatsapp,
      ipAddress: data.ipAddress ?? null,
      packageId: data.packageId,
      dueDateDay: data.dueDateDay,
      status: data.status ?? "active",
    },
  });
}

export async function updateCustomer(
  id: number,
  data: {
    name: string;
    whatsapp: string;
    ipAddress?: string | null;
    packageId: number;
    dueDateDay: number;
    status: string;
  }
) {
  await requireAuth();
  return prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      whatsapp: data.whatsapp,
      ipAddress: data.ipAddress ?? null,
      packageId: data.packageId,
      dueDateDay: data.dueDateDay,
      status: data.status,
    },
  });
}

export async function deleteCustomer(id: number) {
  await requireAuth();
  return prisma.customer.delete({ where: { id } });
}

/* ---------- Billing / Invoices ---------- */

export async function listInvoices(filters: {
  period?: string;
  status?: string;
  search?: string;
}): Promise<InvoiceRow[]> {
  const where: Prisma.InvoiceWhereInput = {};

  if (filters.period) where.billingPeriod = filters.period;
  if (filters.status) where.status = filters.status;

  if (filters.search) {
    where.customer = {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { ipAddress: { contains: filters.search, mode: "insensitive" } },
        { whatsapp: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  const rows = await prisma.invoice.findMany({
    where,
    orderBy: [{ billingPeriod: "desc" }, { id: "desc" }],
    include: { customer: true },
  });

  return rows.map((r) => ({
    id: r.id,
    customerId: r.customerId,
    customerName: r.customer.name,
    customerWhatsapp: r.customer.whatsapp,
    billingPeriod: r.billingPeriod,
    amount: Number(r.amount),
    status: r.status,
    paidAt: r.paidAt,
  }));
}

export async function getUnpaidInvoicesForPeriod(period?: string) {
  const p = period || currentPeriod();
  return listInvoices({ period: p, status: "unpaid" });
}

export async function payInvoice(id: number) {
  await requireAuth();
  const inv = await prisma.invoice.update({
    where: { id },
    data: { status: "paid", paidAt: new Date() },
    include: { customer: true },
  });

  const phone = inv.customer.whatsapp.replace(/^\+/, "").replace(/\s/g, "");
  const text = encodeURIComponent(
    `*Struk Pembayaran PencatatanWiFi*\n\n` +
      `Pelanggan: ${inv.customer.name}\n` +
      `Periode: ${inv.billingPeriod}\n` +
      `Nominal: Rp ${Number(inv.amount).toLocaleString("id-ID")}\n` +
      `Status: LUNAS\n` +
      `Tanggal: ${new Date().toLocaleString("id-ID")}\n\n` +
      `Terima kasih.`
  );
  const waUrl = `https://wa.me/${phone}?text=${text}`;

  return { invoice: inv, waUrl };
}

export async function generateInvoicesForPeriod(period?: string) {
  await requireAuth();
  const p = period || currentPeriod();
  const customers = await prisma.customer.findMany({
    where: { status: "active" },
    include: { package: true },
  });

  const created = [];
  for (const c of customers) {
    const existing = await prisma.invoice.findUnique({
      where: { customerId_billingPeriod: { customerId: c.id, billingPeriod: p } },
    });
    if (existing) continue;

    const inv = await prisma.invoice.create({
      data: {
        customerId: c.id,
        billingPeriod: p,
        amount: c.package?.price ?? 0,
        status: "unpaid",
      },
    });
    created.push(inv);
  }
  return { period: p, created: created.length };
}

export async function getKolektibilitas(period: string) {
  const total = await prisma.invoice.aggregate({
    where: { billingPeriod: period },
    _sum: { amount: true },
    _count: true,
  });
  const paid = await prisma.invoice.aggregate({
    where: { billingPeriod: period, status: "paid" },
    _sum: { amount: true },
    _count: true,
  });

  const totalAmount = Number(total._sum.amount ?? 0);
  const paidAmount = Number(paid._sum.amount ?? 0);
  const ratio = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return {
    period,
    totalCount: total._count ?? 0,
    paidCount: paid._count ?? 0,
    totalAmount,
    paidAmount,
    ratio: Math.round(ratio * 100) / 100,
  };
}

export async function listPeriods() {
  const rows = await prisma.invoice.findMany({
    select: { billingPeriod: true },
    distinct: ["billingPeriod"],
    orderBy: { billingPeriod: "desc" },
  });
  return rows.map((r) => r.billingPeriod);
}

export async function getAuthUser() {
  return getCurrentUser();
}
