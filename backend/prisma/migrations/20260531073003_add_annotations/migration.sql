-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('HIGHLIGHT', 'NOTE', 'COMMENT');

-- CreateTable
CREATE TABLE "annotations" (
    "id" SERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "repoRef" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "exact" TEXT NOT NULL,
    "prefix" TEXT,
    "suffix" TEXT,
    "textPosition" INTEGER,
    "sectionId" TEXT,
    "sectionTitle" TEXT,
    "color" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "annotations_publicId_key" ON "annotations"("publicId");

-- CreateIndex
CREATE INDEX "annotations_userId_idx" ON "annotations"("userId");

-- CreateIndex
CREATE INDEX "annotations_userId_repoOwner_repoName_repoRef_filePath_idx" ON "annotations"("userId", "repoOwner", "repoName", "repoRef", "filePath");

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
