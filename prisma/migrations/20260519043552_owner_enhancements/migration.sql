-- AlterTable
ALTER TABLE "Farmhouse" ADD COLUMN "cancellationPolicy" TEXT;
ALTER TABLE "Farmhouse" ADD COLUMN "checkInTime" TEXT;
ALTER TABLE "Farmhouse" ADD COLUMN "checkOutTime" TEXT;
ALTER TABLE "Farmhouse" ADD COLUMN "directions" TEXT;
ALTER TABLE "Farmhouse" ADD COLUMN "houseRules" TEXT;

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmhouseId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockedDate_farmhouseId_fkey" FOREIGN KEY ("farmhouseId") REFERENCES "Farmhouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BlockedDate_farmhouseId_startDate_endDate_idx" ON "BlockedDate"("farmhouseId", "startDate", "endDate");
