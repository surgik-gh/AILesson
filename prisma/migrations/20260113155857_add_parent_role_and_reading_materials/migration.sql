-- CreateEnum
CREATE TYPE "ReadingCategory" AS ENUM ('DAILY', 'WEEKLY', 'VACATION', 'POETRY', 'PROSE', 'HOMEWORK', 'EXTRA');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PARENT';

-- CreateTable
CREATE TABLE "ReadingMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "url" TEXT,
    "category" "ReadingCategory" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "ReadingMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingAssignment" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "materialId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "ReadingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingAssignment_materialId_studentId_key" ON "ReadingAssignment"("materialId", "studentId");

-- AddForeignKey
ALTER TABLE "ReadingMaterial" ADD CONSTRAINT "ReadingMaterial_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingAssignment" ADD CONSTRAINT "ReadingAssignment_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "ReadingMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingAssignment" ADD CONSTRAINT "ReadingAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
