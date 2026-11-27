ALTER TABLE "User" ADD COLUMN "goalName" TEXT;
ALTER TABLE "User" ADD COLUMN "goalDate" DATE;
ALTER TABLE "User" ADD COLUMN "reminderTime" TEXT;

CREATE TABLE "NutritionLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "waterLiters" DECIMAL(6,2),
  "proteinGrams" DECIMAL(7,2),
  "calories" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NutritionLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NutritionLog_userId_date_key" ON "NutritionLog"("userId", "date");
CREATE INDEX "NutritionLog_userId_date_idx" ON "NutritionLog"("userId", "date");
ALTER TABLE "NutritionLog" ADD CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
