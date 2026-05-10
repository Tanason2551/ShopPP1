-- CreateTable
CREATE TABLE "ShopConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Shop PP',
    "address" TEXT DEFAULT '123 Market Street, City Center',
    "phone" TEXT DEFAULT '02-xxx-xxxx',
    "logo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopConfig_pkey" PRIMARY KEY ("id")
);
