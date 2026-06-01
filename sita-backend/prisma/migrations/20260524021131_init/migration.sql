-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "nis" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Halaqah" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ustadzId" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Halaqah_ustadzId_fkey" FOREIGN KEY ("ustadzId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HalaqahStudent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "halaqahId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HalaqahStudent_halaqahId_fkey" FOREIGN KEY ("halaqahId") REFERENCES "Halaqah" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HalaqahStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentParent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "parentId" INTEGER NOT NULL,
    "relationship" TEXT NOT NULL,
    CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" INTEGER NOT NULL,
    "ustadzId" INTEGER NOT NULL,
    "halaqahId" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "startAyah" INTEGER NOT NULL,
    "endAyah" INTEGER NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "errorJaliCount" INTEGER NOT NULL,
    "errorKhafiCount" INTEGER NOT NULL,
    "errorTarkCount" INTEGER NOT NULL,
    "scoreInitial" INTEGER NOT NULL DEFAULT 100,
    "scoreFinal" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "notesUstadz" TEXT,
    "scoringConfigSnapshot" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionLog_ustadzId_fkey" FOREIGN KEY ("ustadzId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionLog_halaqahId_fkey" FOREIGN KEY ("halaqahId") REFERENCES "Halaqah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErrorBookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "ayahId" INTEGER NOT NULL,
    "wordIndex" INTEGER NOT NULL,
    "wordTextAr" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "penaltyApplied" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ErrorBookmark_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scoreInitial" INTEGER NOT NULL DEFAULT 100,
    "penaltyJali" INTEGER NOT NULL DEFAULT 3,
    "penaltyKhafi" INTEGER NOT NULL DEFAULT 1,
    "penaltyTark" INTEGER NOT NULL DEFAULT 2,
    "passThreshold" INTEGER NOT NULL DEFAULT 80,
    "updatedBy" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Surah" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Ayah" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "surahId" INTEGER NOT NULL,
    "ayahId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Ayah_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
