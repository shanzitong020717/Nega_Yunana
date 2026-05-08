-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED', 'PROCESSING_NOT_SUPPORTED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PDF', 'PPTX', 'DOCX', 'TXT', 'MARKDOWN');

-- CreateEnum
CREATE TYPE "PracticeMode" AS ENUM ('PRESENTATION_REHEARSAL', 'CUSTOMER_QA', 'OBJECTION_CHALLENGE', 'SOLUTION_MEETING');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'NORMAL', 'HARD', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "PracticeSessionStatus" AS ENUM ('CREATED', 'ACTIVE', 'COMPLETED', 'REVIEWED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "TranscriptSpeaker" AS ENUM ('USER', 'AI_CUSTOMER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PhraseSource" AS ENUM ('BUILT_IN', 'MATERIAL', 'REVIEW', 'USER_ADDED');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('NEW', 'NEEDS_PRACTICE', 'PRACTICING', 'MASTERED');

-- CreateEnum
CREATE TYPE "WeaknessType" AS ENUM ('LONG_ANSWERS', 'FEATURE_ONLY_TALK', 'WEAK_DISCOVERY', 'UNCLEAR_POSITIONING', 'WEAK_OBJECTION_HANDLING', 'REPETITIVE_VOCABULARY', 'MISSING_NEXT_STEP', 'GRAMMAR_ACCURACY', 'PRONUNCIATION_CLARITY', 'FLUENCY');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "englishLevel" TEXT NOT NULL DEFAULT 'B2',
    "trainingPreferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "customerType" TEXT,
    "industry" TEXT,
    "meetingGoal" TEXT,
    "confidentialMode" BOOLEAN NOT NULL DEFAULT true,
    "processingStatus" "MaterialStatus" NOT NULL DEFAULT 'UPLOADED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialBrief" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "keyMessage" TEXT NOT NULL,
    "productPoints" JSONB NOT NULL DEFAULT '[]',
    "customerValue" JSONB NOT NULL DEFAULT '[]',
    "likelyQuestions" JSONB NOT NULL DEFAULT '[]',
    "likelyObjections" JSONB NOT NULL DEFAULT '[]',
    "riskyClaims" JSONB NOT NULL DEFAULT '[]',
    "usefulPhrases" JSONB NOT NULL DEFAULT '[]',
    "glossary" JSONB NOT NULL DEFAULT '[]',
    "outline" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialId" TEXT,
    "customerType" TEXT NOT NULL,
    "industry" TEXT,
    "countryOrRegion" TEXT,
    "meetingGoal" TEXT NOT NULL,
    "knownConcerns" JSONB NOT NULL DEFAULT '[]',
    "trainingFocus" JSONB NOT NULL DEFAULT '[]',
    "customerContext" TEXT NOT NULL,
    "keyTalkingPoints" JSONB NOT NULL DEFAULT '[]',
    "discoveryQuestions" JSONB NOT NULL DEFAULT '[]',
    "likelyObjections" JSONB NOT NULL DEFAULT '[]',
    "openingScript" TEXT NOT NULL,
    "mustUsePhrases" JSONB NOT NULL DEFAULT '[]',
    "doNotOverpromise" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrepCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "PracticeMode" NOT NULL,
    "personaId" TEXT NOT NULL,
    "materialId" TEXT,
    "prepCardId" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'NORMAL',
    "trainingFocus" JSONB NOT NULL DEFAULT '[]',
    "sourceObjectionId" TEXT,
    "status" "PracticeSessionStatus" NOT NULL DEFAULT 'CREATED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "speaker" "TranscriptSpeaker" NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "meetingOutcome" JSONB NOT NULL DEFAULT '{}',
    "scores" JSONB NOT NULL DEFAULT '{}',
    "topImprovements" JSONB NOT NULL DEFAULT '[]',
    "bestMoments" JSONB NOT NULL DEFAULT '[]',
    "sentenceUpgrades" JSONB NOT NULL DEFAULT '[]',
    "materialCoverage" JSONB NOT NULL DEFAULT '{}',
    "phrasebookSuggestions" JSONB NOT NULL DEFAULT '[]',
    "weaknessUpdates" JSONB NOT NULL DEFAULT '[]',
    "nextSessionRecommendation" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phrase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "chinese" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "simpleVersion" TEXT,
    "professionalVersion" TEXT,
    "relatedProductPoint" TEXT,
    "relatedObjection" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "source" "PhraseSource" NOT NULL DEFAULT 'USER_ADDED',
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "masteryStatus" "MasteryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeaknessMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WeaknessType" NOT NULL,
    "severity" INTEGER NOT NULL,
    "evidence" TEXT NOT NULL,
    "recommendedDrill" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeaknessMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_ownerId_idx" ON "Material"("ownerId");

-- CreateIndex
CREATE INDEX "Material_processingStatus_idx" ON "Material"("processingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialBrief_materialId_key" ON "MaterialBrief"("materialId");

-- CreateIndex
CREATE INDEX "PrepCard_userId_idx" ON "PrepCard"("userId");

-- CreateIndex
CREATE INDEX "PrepCard_materialId_idx" ON "PrepCard"("materialId");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_idx" ON "PracticeSession"("userId");

-- CreateIndex
CREATE INDEX "PracticeSession_materialId_idx" ON "PracticeSession"("materialId");

-- CreateIndex
CREATE INDEX "PracticeSession_status_idx" ON "PracticeSession"("status");

-- CreateIndex
CREATE INDEX "TranscriptTurn_sessionId_idx" ON "TranscriptTurn"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_sessionId_key" ON "Review"("sessionId");

-- CreateIndex
CREATE INDEX "Phrase_userId_idx" ON "Phrase"("userId");

-- CreateIndex
CREATE INDEX "Phrase_category_idx" ON "Phrase"("category");

-- CreateIndex
CREATE INDEX "Phrase_source_idx" ON "Phrase"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Phrase_userId_english_key" ON "Phrase"("userId", "english");

-- CreateIndex
CREATE INDEX "WeaknessMetric_userId_idx" ON "WeaknessMetric"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeaknessMetric_userId_type_key" ON "WeaknessMetric"("userId", "type");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialBrief" ADD CONSTRAINT "MaterialBrief_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepCard" ADD CONSTRAINT "PrepCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepCard" ADD CONSTRAINT "PrepCard_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_prepCardId_fkey" FOREIGN KEY ("prepCardId") REFERENCES "PrepCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptTurn" ADD CONSTRAINT "TranscriptTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phrase" ADD CONSTRAINT "Phrase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeaknessMetric" ADD CONSTRAINT "WeaknessMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
