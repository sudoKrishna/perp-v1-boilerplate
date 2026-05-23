import {prisma} from "../config/db";

export class positionService {
    async applyFill (
     userId :  number,
     market : string,
     side : "BUY" | "SELL",
     price : number,
     qty : number
    ) {
        const type = side === "BUY" ? "LONG" : "SHORT";
        let position = await  prisma.position.findFirst({
            where : {
                userId,
                market,
                status : "OPEN",
            },
        });

        if(!position) {
            return prisma.position.create({
                data : {
                    userId,
                    market,
                    type,
                    qty,
                    entryPrice : price,
                    averagePrice : price,
                    margin : 0,
                    leverage : 10,
                    liquidationPrice : 
                    type === "LONG"
                     ?  price * 0.5
                     : price * 1.5,
                     pnl : 0,
                     status : "OPEN"
                },
            });
        }
    }
}