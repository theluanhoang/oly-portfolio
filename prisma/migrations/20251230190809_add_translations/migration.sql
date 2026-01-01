-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "namespace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translations_locale_idx" ON "translations"("locale");

-- CreateIndex
CREATE INDEX "translations_namespace_idx" ON "translations"("namespace");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_locale_namespace_key" ON "translations"("key", "locale", "namespace");
