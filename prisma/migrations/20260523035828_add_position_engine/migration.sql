/*
  Warnings:

  - The primary key for the `Fill` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `filled` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `pnl` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `collateralId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Collateral` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Collateral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `side` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leverage` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `side` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `orderType` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `entryPrice` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leverage` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updateAt` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `Position` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Side" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('LIMIT', 'MARKET');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_collateralId_fkey";

-- DropIndex
DROP INDEX "User_collateralId_key";

-- AlterTable
ALTER TABLE "Collateral" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Fill" DROP CONSTRAINT "Fill_pkey",
DROP COLUMN "filled",
DROP COLUMN "timestamp",
DROP COLUMN "type",
ADD COLUMN     "buyOrderId" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "sellOrderId" INTEGER,
ADD COLUMN     "side" "Side" NOT NULL,
ADD CONSTRAINT "Fill_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "type",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "leverage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "side" "Side" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "orderType",
ADD COLUMN     "orderType" "OrderType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "pnl",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entryPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "leverage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "realizedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unrealizedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "collateralId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "MarketType";

-- DropEnum
DROP TYPE "StatusType";

-- CreateIndex
CREATE UNIQUE INDEX "Collateral_userId_key" ON "Collateral"("userId");

-- AddForeignKey
ALTER TABLE "Collateral" ADD CONSTRAINT "Collateral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
