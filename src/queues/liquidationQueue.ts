import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const liquidationQueue = new Queue("liquidation-queue", {
  connection: redisConnection,
});