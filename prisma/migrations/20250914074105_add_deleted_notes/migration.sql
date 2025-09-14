-- CreateTable
CREATE TABLE "DeletedNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '',
    "folderId" INTEGER,
    "originalId" INTEGER NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "DeletedNote_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeletedNote_originalId_key" ON "DeletedNote"("originalId");
