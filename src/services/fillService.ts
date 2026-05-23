import {prisma} from "../config/db";

export const createFill = async (trade : any) => {
    return prisma.fill.createMany({
        data : [
            {
                orderId : trade.buyOrderId,
                userId : trade.buyerUserId,
                market : trade.market,
                side : "BUY",
                qty : trade.qty,
                price : trade.price,
                buyOrderId: trade.buyOrderId,
                sellOrderId : trade.sellOrderId
            },
            {
                orderId : trade.sellOrderId,
                userId : trade.sellerUserId,
                market : trade.market,
                side :"SELL",
                qty : trade.qty,
                price: trade.price,
                buyOrderId: trade.buyOrderId,
                sellOrderId: trade.sellOrderId,
            }
        ]
    })
}