import { Worker } from "bullmq";
import {prisma}  from "../config/db";
import { redisConnection } from "../config/redis";
import { TradeEngin } from "../services/tradeEngine";
import {PositionService} from "../services/positionService";
import { createFill } from "../services/fillService";


const engine = new TradeEngin();
const positionService = new PositionService;


export const orderWorker = new Worker(
    "orderQueue",
    async (job) => {
        const {userId , order} = job.data;

        const user = await prisma.user.findUnique({
            where : {userId},
            include : {collateral : true},
        });

        if(!user?.collateral) {
            throw new Error("collateral not found")
        }

        await prisma.collateral.update({
            where : {id : user.collateral.id},
            data : {
                available : user.collateral.available - order.margin,
                locked : user.collateral.locked + order.margin
            },
        });

    },
)