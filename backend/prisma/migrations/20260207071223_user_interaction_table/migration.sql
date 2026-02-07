-- CreateEnum
CREATE TYPE "InteractionState" AS ENUM ('SIGNAL', 'LIKED', 'REJECTED');

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "state" "InteractionState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserInteraction_toUserId_state_idx" ON "UserInteraction"("toUserId", "state");

-- CreateIndex
CREATE INDEX "UserInteraction_fromUserId_state_idx" ON "UserInteraction"("fromUserId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "UserInteraction_fromUserId_toUserId_key" ON "UserInteraction"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
