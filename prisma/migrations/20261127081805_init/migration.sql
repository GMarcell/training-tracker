-- CreateEnum
CREATE TYPE "DayKind" AS ENUM ('TRAINING', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('REPS', 'SECONDS');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'NEUTRAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyTarget" INTEGER NOT NULL DEFAULT 5,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayType" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "DayKind" NOT NULL DEFAULT 'TRAINING',
    "plannedWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "countsTowardTarget" BOOLEAN NOT NULL DEFAULT true,
    "skipInMatchWeek" BOOLEAN NOT NULL DEFAULT false,
    "isMatch" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "dayTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetText" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "unit" "Unit" NOT NULL DEFAULT 'REPS',
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExerciseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "direction" "Direction" NOT NULL DEFAULT 'HIGHER_IS_BETTER',
    "decimals" INTEGER NOT NULL DEFAULT 1,
    "targetMin" DECIMAL(10,2),
    "targetMax" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkValue" (
    "id" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "value" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "BenchmarkValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekTargetOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "target" INTEGER NOT NULL,

    CONSTRAINT "WeekTargetOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DayType_userId_idx" ON "DayType"("userId");

-- CreateIndex
CREATE INDEX "Exercise_dayTypeId_idx" ON "Exercise"("dayTypeId");

-- CreateIndex
CREATE INDEX "Session_userId_date_idx" ON "Session"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_date_key" ON "Session"("userId", "date");

-- CreateIndex
CREATE INDEX "ExerciseEntry_sessionId_idx" ON "ExerciseEntry"("sessionId");

-- CreateIndex
CREATE INDEX "Metric_userId_idx" ON "Metric"("userId");

-- CreateIndex
CREATE INDEX "Benchmark_userId_date_idx" ON "Benchmark"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_userId_date_key" ON "Benchmark"("userId", "date");

-- CreateIndex
CREATE INDEX "BenchmarkValue_metricId_idx" ON "BenchmarkValue"("metricId");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkValue_benchmarkId_metricId_key" ON "BenchmarkValue"("benchmarkId", "metricId");

-- CreateIndex
CREATE INDEX "WeekTargetOverride_userId_idx" ON "WeekTargetOverride"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeekTargetOverride_userId_weekStart_key" ON "WeekTargetOverride"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "DayType" ADD CONSTRAINT "DayType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_dayTypeId_fkey" FOREIGN KEY ("dayTypeId") REFERENCES "DayType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_dayTypeId_fkey" FOREIGN KEY ("dayTypeId") REFERENCES "DayType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseEntry" ADD CONSTRAINT "ExerciseEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseEntry" ADD CONSTRAINT "ExerciseEntry_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Benchmark" ADD CONSTRAINT "Benchmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkValue" ADD CONSTRAINT "BenchmarkValue_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkValue" ADD CONSTRAINT "BenchmarkValue_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekTargetOverride" ADD CONSTRAINT "WeekTargetOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
