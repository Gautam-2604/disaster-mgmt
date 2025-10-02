/*
  Warnings:

  - Made the column `currentActions` on table `conversations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "currentActions" SET NOT NULL;
