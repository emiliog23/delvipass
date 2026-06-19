-- CreateTable with new columns, copy data, drop old table
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "venue" TEXT NOT NULL,
    "capacity" INTEGER,
    "imageUrl" TEXT,
    "purchaseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mpAccessToken" TEXT,
    "price" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Event" ("id","creatorId","name","description","date","venue","capacity","imageUrl","purchaseEnabled","createdAt")
SELECT "id","creatorId","name","description","date","venue","capacity","imageUrl","purchaseEnabled","createdAt"
FROM "Event";

DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";

PRAGMA foreign_keys=ON;
