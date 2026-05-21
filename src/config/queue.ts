import {Queue} from "bullmq";
import IORedis from "ioredis";

export const RedisConnection = new IORedis({
    host  : "127.0.0.1",
    port : 6379,
});

export const orderQueue = new Queue("order-queue", {
    connection : RedisConnection,
})

export const tradeQueue = new Queue("trade-queue", {
    connection : RedisConnection,
})

export const liquidationQueue = new Queue("liquidation-queue", {
    connection : RedisConnection,
})