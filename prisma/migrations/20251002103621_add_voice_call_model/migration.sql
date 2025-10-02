-- CreateTable
CREATE TABLE "voice_calls" (
    "id" TEXT NOT NULL,
    "callSid" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "transcription" TEXT,
    "transcriptionConfidence" DOUBLE PRECISION,
    "emergencyMessageId" TEXT,
    "conversationId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voice_calls_callSid_key" ON "voice_calls"("callSid");
