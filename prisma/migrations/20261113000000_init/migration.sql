-- CreateTable packages
CREATE TABLE "packages" (
    "id" SERIAL NOT NULL,
    "package_name" VARCHAR(50) NOT NULL,
    "bandwidth" VARCHAR(20) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable customers
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(50),
    "package_id" INTEGER NOT NULL,
    "due_date_day" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customers_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable invoices
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "billing_period" VARCHAR(7) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex unique customer + billing period
CREATE UNIQUE INDEX "invoices_customer_id_billing_period_key" ON "invoices"("customer_id", "billing_period");
