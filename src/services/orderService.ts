import { prisma } from "../config/db";
import { orderQueue } from "../config/queue";

type OrderInput = {
    userId: string;
    market: string;
    type: "LONG" | "SHORT";
    qty: number;
    margin: number;
    orderType: "limit" | "market";
    price: number;
}

export const createOrder = async (order: OrderInput) => {
    const userId = Number(order.userId);
    const validType = order.type === "LONG" || order.type === "SHORT";

    const validOrderType = order.orderType === "limit" || order.orderType === "market";

    if (
        !order.userId ||
        !order.market ||
        !order.qty ||
        !order.margin ||
        !order.price
    ) {
        throw new Error("missing required fields")
    };

    if (!validType || !validOrderType) {
        throw new Error("Invalid order type")
    }

    if (order.qty <= 0) {
        throw new Error(
            "Quantity must be greater than 0"
        );
    }

    if (order.margin <= 0) {
        throw new Error(
            "margin must be greater then 0"
        )
    }

    if (order.price <= 0) {
        throw new Error(
            "price must be greater then 0"
        )
    }

    const user = await prisma.user.findUnique({
        where: {
            userId: Number(userId),
        },
        include: {
            collateral: true,
        },
    });

    if (!user) {
        throw new Error("user in not found")
    }

    const collateral = user.collateral;

    if (!collateral) { throw new Error("Collateral not found"); }

    if (collateral.available < order.margin) {
        throw new Error("Insufficient collateral")
    }

    const job = await orderQueue.add(
        "create-order",
        {
         userId,
            order,},
        {
        attempts: 3,
            removeOnComplete: true,}
    );

    return {
        message:
            "Order queued successfully",
        jobId: job.id,
    };

    // await prisma.collateral.update({
    //     where: {
    //         id: collateral.id
    //     },
    //     data: {
    //         available: collateral.available - order.margin,
    //         locked: collateral.locked + order.margin
    //     },
    // });

    // const newOrder =
    //     await prisma.order.create({
    //         data: {
    //             userId,

    //             market: order.market,

    //             type: order.type,
    //             qty: order.qty,
    //             margin: order.margin,
    //             orderType: order.orderType,
    //             price: order.price,
    //             status: "OPEN",
    //         },
    //     });
    // const newPosition =
    //     await prisma.position.create({
    //         data: {
    //             userId,
    //             market: order.market,
    //             type: order.type,
    //             qty: order.qty,
    //             margin: order.margin,
    //             averagePrice: order.price,
    //             liquidationPrice: order.price * 0.5,
    //             pnl: 0,
    //             status: "OPEN",

    //         },
    //     });

    // await orderQueue.add(
    //     "new-order",
    //     {
    //         orderId: newOrder.orderId,
    //     }
    // )

    // return {
    //     message: "order created successfully",
    //     order: newOrder,

    //     position: newPosition,
    // };
};

export const cancelExistingOrder = async (orderId: number) => {
    const order = await prisma.order.findUnique({
        where: { orderId }
    })

    if (!order) {
        throw new Error("order not found")
    }

    if (order.status !== "OPEN") {
        throw new Error("order can not cancelled")
    }

    const user = await prisma.user.findUnique({
        where: { userId: order.userId },
        include: { collateral: true }
    });

    if (!user || !user.collateral) {
        throw new Error("user or colletral not found")
    }

    await prisma.collateral.update({
        where: { id: user.collateral.id },
        data: {
            available: user.collateral.available + order.margin,
            locked: user.collateral.locked - order.margin,
        },
    });

    const cancelledOrder = await prisma.order.update({
        where: { orderId },
        data: {
            status: "CANCELLED"
        },
    });
    return {
        message: "Order cancelled",
        order: cancelledOrder,
    }
}

