-- CreateTable
CREATE TABLE "project_relations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "relatedProjectId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_relations_projectId_idx" ON "project_relations"("projectId");

-- CreateIndex
CREATE INDEX "project_relations_relatedProjectId_idx" ON "project_relations"("relatedProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_relations_projectId_relatedProjectId_key" ON "project_relations"("projectId", "relatedProjectId");

-- AddForeignKey
ALTER TABLE "project_relations" ADD CONSTRAINT "project_relations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_relations" ADD CONSTRAINT "project_relations_relatedProjectId_fkey" FOREIGN KEY ("relatedProjectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;