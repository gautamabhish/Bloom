/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MALE',
ADD COLUMN     "poem" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "username" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "UsernamePool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "taken" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,

    CONSTRAINT "UsernamePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarPool" (
    "id" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "url" TEXT NOT NULL,
    "taken" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,

    CONSTRAINT "AvatarPool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsernamePool_name_key" ON "UsernamePool"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UsernamePool_userId_key" ON "UsernamePool"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarPool_userId_key" ON "AvatarPool"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
