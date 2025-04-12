-- CreateTable
CREATE TABLE "Status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MainTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "statusId" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "MainTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MainTask_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MainTask" ("description", "id", "title", "userId") SELECT "description", "id", "title", "userId" FROM "MainTask";
DROP TABLE "MainTask";
ALTER TABLE "new_MainTask" RENAME TO "MainTask";
CREATE TABLE "new_Subtask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" DATETIME,
    "endAt" DATETIME,
    "statusId" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MainTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subtask_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subtask" ("description", "endAt", "id", "startAt", "statusId", "taskId", "title") SELECT "description", "endAt", "id", "startAt", "statusId", "taskId", "title" FROM "Subtask";
DROP TABLE "Subtask";
ALTER TABLE "new_Subtask" RENAME TO "Subtask";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
