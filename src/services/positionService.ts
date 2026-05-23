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

        const sameSide = (position.type === "LONG" && side === "BUY") ||
        (position.type === "SHORT" && side === "SELL")

        if(sameSide) {
            const newQty = position.qty + qty;

            const avg = (position.averagePrice * position.qty + price*qty) / newQty;

            return prisma.position.update({
                where : {
                    positionId : position.positionId
                },
            data : {
                qty : newQty,
                averagePrice : avg,
                entryPrice : avg,
            },
            });
        }

        const closeQty = Math.min(
            position.qty,
            qty
        );

        let  pnl = 0;

        if(position.type === "LONG") {
            pnl = (price - position.averagePrice) * closeQty;
        } else {
            pnl = (position.averagePrice - price) * closeQty;
        }

        const remaining = position.qty - closeQty;

        if(remaining === 0) {
            return prisma.position.update({
                where : {
                    positionId : position.positionId,
                },
                data : {
                    qty : 0,
                    status : "CLOSED",
                    pnl : position.realizedPnl + pnl,
                },
            });
        }

        return prisma.position.update({
            where : {
                positionId : position.positionId,
            },
            data : {
                qty : remaining,
                pnl : position.realizedPnl + pnl,
            }
        })
        
    }


}