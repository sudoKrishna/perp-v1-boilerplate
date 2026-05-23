import { Worker } from "bullmq";
import { prisma } from "../config/db";
import { redisConnection } from "../config/redis";
import { TradeEngin } from "../services/tradeEngine";
import { PositionService } from "../services/positionService";

const engine = new TradeEngin();
const positionService = new PositionService();

const orderWorker = new Worker(
    "orderQueue",
    async (job) => {
        const { userId, order } = job.data;

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { userId },
                include: { collateral: true },
            });

            if (!user?.collateral) {
                throw new Error("collateral not found");
            }

            const collateral = user.collateral;

            if (collateral.available < order.margin) {
                throw new Error("Insufficient collateral");
            }

            await tx.collateral.update({
                where: { id: collateral.id },
                data: {
                    available: collateral.available - order.margin,
                    locked: collateral.locked + order.margin,
                },
            });

            const savedOrder = await tx.order.create({
                data: {
                    userId,
                    market: order.market,
                    side: order.side,
                    orderType: order.orderType,
                    qty: order.qty,
                    price: order.price,
                    margin: order.margin,
                    leverage: order.leverage,
                    status: "OPEN",
                },
            });

            const trades = engine.processOrder({
                id: savedOrder.orderId.toString(),
                userId,
                market: order.market,
                side: order.side,
                qty: order.qty,
                price: order.price,
                type: order.orderType,
                createdAt: Date.now(),
            });

            for (const trade of trades) {
                await positionService.applyFill(
                    trade.buyerUserId,
                    order.market,
                    "BUY",
                    trade.price,
                    trade.qty
                );

                await positionService.applyFill(
                    trade.sellerUserId,
                    order.market,
                    "SELL",
                    trade.price,
                    trade.qty
                );
            }
        });

        return true;
    },
    {
        connection: redisConnection,
        concurrency: 50,
    }
);

orderWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

orderWorker.on("failed", (job, err) => {
    console.error(`job ${job?.id} failed`, err);
});