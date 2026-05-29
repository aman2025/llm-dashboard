/*
  Warnings:

  - You are about to drop the column `defaultLlmName` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `interfaceLanguage` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `llmNames` on the `Settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "defaultLlmName",
DROP COLUMN "interfaceLanguage",
DROP COLUMN "llmNames",
ADD COLUMN     "activeLlmId" TEXT;

-- CreateTable
CREATE TABLE "LlmModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LLM',
    "description" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "quantization" TEXT NOT NULL,
    "contextWindow" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LlmModel_name_key" ON "LlmModel"("name");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_activeLlmId_fkey" FOREIGN KEY ("activeLlmId") REFERENCES "LlmModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
