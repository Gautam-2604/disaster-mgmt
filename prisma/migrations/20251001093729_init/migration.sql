-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('RESPONDER', 'DISPATCHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MessageSource" AS ENUM ('TWITTER', 'SMS', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'EMAIL', 'PHONE_CALL', 'MANUAL_ENTRY', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('RESCUE', 'MEDICAL', 'FOOD', 'SHELTER', 'WATER', 'INFORMATION', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('GPS', 'USER_PROVIDED', 'AI_INFERRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('UNPROCESSED', 'AI_CLASSIFIED', 'ACTION_GENERATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'DUPLICATE', 'INVALID');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'RESPONDER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_messages" (
    "id" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "source" "MessageSource" NOT NULL,
    "sourceId" TEXT,
    "authorName" TEXT,
    "authorContact" TEXT,
    "category" "MessageCategory",
    "priority" "Priority",
    "confidence" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "locationSource" "LocationSource",
    "actionSteps" TEXT,
    "resourcesNeeded" TEXT,
    "estimatedCount" INTEGER,
    "status" "MessageStatus" NOT NULL DEFAULT 'UNPROCESSED',
    "assignedTo" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "emergency_messages" ADD CONSTRAINT "emergency_messages_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
