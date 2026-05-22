import {Queue} from "bullmq";
import { redisConnection } from "./redis";

export const orderQueue = new Queue("order-queue", {
    connection : redisConnection,
})

export const tradeQueue = new Queue("trade-queue", {
    connection : redisConnection,
})

export const liquidationQueue = new Queue("liquidation-queue", {
    connection : redisConnection,
})