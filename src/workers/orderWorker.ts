import { Worker } from "bullmq";
import {prisma}  from "../config/db";
import { RedisConnection } from "../config/queue";

const orderWorker = new Worker(
    "orderQueue",
    async (job) => {
        const {userId , order} = job.data;

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where : {userId},
                include : {
                    collateral : true,
                },
            });

            if(!user?.collateral) {
                throw new Error(
                    "collateral not found"
                );
            }

            const collateral = user.collateral;

            await tx.collateral.update({
                where : {id: collateral.id,},
                 data : {available : collateral.available - order.margin, 
                         locked : collateral.locked + order.margin,
                 },
            });

            await tx.order.create({
                data : {
                    userId,
                    market : order.market,
                    type : order.type,
                    qty : order.qty,
                    margin : order.margin,
                    orderType : order.orderType,
                    price : order.price,
                    status : "OPEN" ,
                },
            });

            await tx.position.create({
                data : {
                    userId,
                    market : order.market,
                    type : order.type,
                    qty : order.qty,
                    margin : order.margin,
                    averagePrice : order.price,
                    liquidationPrice : order.price * 0.5,
                    pnl : 0,
                    status : "OPEN",
                },
            });
        });

        console.log("order succesfull");
    },
    {
        connection : RedisConnection,
    }
);

orderWorker.on(
    "completed",
    (job) => {
        console.log(`Job ${job.id} completed`);
    }
);

orderWorker.on(
    "failed",
    (job, err) => {
        console.error(`job ${job?.id} failed` , err)
    }
)