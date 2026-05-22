import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const tradeQueue = new Queue("trade-queue", {
  connection: redisConnection,
});