import express from "express";
import { isExpressionWithTypeArguments } from "typescript";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

type PositionType = "LONG" | "SHORT";
type MarketType = "limit" | "market";
type StatusType = "OPEN" | "FILLED" | "CANCELLED";


interface Position {
    positionId: number;
    userId: number;
    market : string;
    type : "LONG" | "SHORT";
    qty : number;
    margin : number;
    averagePrice : number;
    liquidationPrice : number;
    pnl : number; 
    status : "OPEN" | "CLOSED"
}

interface Order {
    orderId: number;
    market: string;
    type: PositionType;
    qty: number;
    margin: number;
    orderType: MarketType;
    price: number;
    status: StatusType;
}

interface User {
    userId: number,
    username: string,
    password: string,
    collateral: {
        available: number,
        locked: number,
    },
    orders?: Order[];
    positions : Position[];

}

const users: User[] = [];
const JWT_SECRET: string = "this"

// const users : = [{
//     userId: 1,
//     username: "harkirat",
//     password: 123123,
//     collateral: {
//          availabe: 2000,
//          locked: 1000
//     },
//      positions: [
//         { market: "SOL", type: "LONG", qty: 10, margin: 500, liquidationPrice: 80, averagePrice: 90 },
//         { market: "ETH", type: "SHORT", qty: 1, margin: 500, liquidationPrice: 2000, averagePrice: 1900 }
//     ],
//     orders: [
//         { orderId: 1, market: "SOL", type: "LONG", qty: 10, margin: 500, orderType: "limit", price: 90, status: "filled" },
//         { orderId: 2, market: "ETH", type: "SHORT", qty: 10, margin: 500, orderType: "limit", price: 1900, status: "filled" },
//         { orderId: 3, market: "BTC", type: "LONG", qty: 10, margin: 500, orderType: "limit", price: 1900, status: "cancelled" },
//     ]
// }, {
//     userId: 2,
//     username: "raman",
//     password: 123123,
//     collateral: {
//          availabe: 2000,
//          locked: 2000
//     },
//     positions: [
//         { market: "SOL", type: "SHORT", qty: 10,  margin: 1000, liquidationPrice: 80, pnL: 200, averagePrice: 90 },
//         { market: "ETH", type: "LONG", qty: 1, margin: 1000, liquidationPrice: 2000, pnL: -100, averagePrice: 1900 }
//     ],
//     orders: [
//         { orderId: 10, market: "SOL", type: "SHORT", qty: 10, margin: 500, orderType: "market", price: 90, status: "filled" },
//         { orderId: 11, market: "ETH", type: "LONG", qty: 10, margin: 500, orderType: "market", price: 1900, status: "filled" },
//         { orderId: 12, market: "ZEC", type: "LONG", qty: 10, margin: 500, orderType: "limit", price: 1900, status: "open" },
//     ]
// }];

// type Bid = {
//     availableQty: number,
//     openOrders: { userId: number, qty: number, filledQty: number, orderId: number, createdAt: Date }[]
// }

// type Orderbook = {
//     bids: Record<string, Bid>,
//     asks: Record<string, Bid>,
//     lastTradedPrice: number,
//     indexPrice: number
// }

// type Orderbooks = Record<string, Orderbook>

// const orderbooks: Orderbooks = {
//      SOL: { bids: {}, asks: {}, lastTradedPrice: 90, indexPrice: 90.01 },
//      ETH: { bids: {}, asks: {}, lastTradedPrice: 1900, indexPrice: 1899.9 }
// }

// const fills = [{
//     maker: 1,
//     taker: 2,
//     market: "SOL",
//     qty: 10,
//     price: 90,
//     long: 1,
//     short: 2
// }, {
//     maker: 1,
//     taker: 2,
//     market: "ETH",
//     qty: 1,
//     price: 1900,
//     long: 2,
//     short: 1
// }];

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    //valididate karna hai

    if (!username || !password) {
        return res.status(400).json({
            message: "user name and password is required"
        });
    }
    // checking the existing user

    const existingUser = users.find((user) => user.username === username);

    if (existingUser) {
        return res.status(401).json({
            message: "User already exists"
        });
    }

    try {
        // hash

        const hashPassword = await bcrypt.hash(password, 10);

        users.push({
            userId: Date.now(),
            username,
            password: hashPassword,
            collateral: {
                available: 0,
                locked: 0,
            },
            orders: [],
            positions : []

        });

        res.status(201).json({
            message: "signup successful"
        });

    } catch (error) {
        res.status(500).json({
            message: "internal error"
        })
    }
})
app.post("/signin" , async (req , res) => {
const {username , password} = req.body;

const user = users.find((user) => user.username === username)

if(!user) {
    return res.status(400).json({
        message : "user is not found"
    });
}

try {
    const isPasswordCorrect = await bcrypt.compate(
        password,
        user,password
    );

    if(!isPasswordCorrect) {
        return res.status(400).json({
            message : "password was not correct"
        })
    }

    const token = jwt.sign(
        {username : user.username},
        JWT_SECRET,
        {expiresIn : "1hr"}
    );

    res.json({
        message : "signin successfull",
        token : token
    });
} catch (error) {
    res.status(500).json({
        message : "internal server error"
    });
};
});
app.post("/onramp", (req, res) => {
    const {userId , amount} = req.body;

    if(!userId || !amount) {
        return res.status(400).json({
            message : "userId and amount is required"
        })
    }

    if(amount <= 0) {
        return res.status(400).json({
            message : "amount is invalid"
        })
    }
    const user = users.find((u) => u.userId === userId);

    if(!user ) { 
        return res.status(400).json({
            message : "user is not found"
        })
    }

    user.collateral.available += amount;

    res.status(200).json({
        message : "onramp is succesfull",
        collateral : user.collateral,
    })
})
app.post("/order" ,(req , res) => {
    const order = req.body;
    const {userId} = req.body;

    if(!userId) {
        return res.status(400).json({message : "userId is requires"})
    }

    function isValidOrder(order : any): boolean {
        const validType = order.type === "LONG" || order.type === "SHORT";
        const validOrderType = order.orderType === "limit" || order.orderType === "market";
        return (
            order.orderId !== undefined &&
            order.market !== undefined &&
            order.type !== undefined &&
            order.qty !== undefined &&
            order.marge !== undefined &&
            order.orderType !== undefined &&
            order.price !== undefined &&
            order.price >= 0 &&
            order.status !== undefined &&
            order.qty > 0 &&
            order.margin > 0 &&
            validType &&
            validOrderType
        );
    }
    if(!isValidOrder(order)) {
        return res.status(400).json({
            message : "missing the required fields"
        })
    }

    const user = users.find((u) => u.userId === userId);

    if(!user) {
        return res.status(400).json({
            message : "user in not found"
        })
    }

    if(user.collateral.available < order.margin) {
        return res.status(400).json({
            message : "insufficient collateral"
        })
    }

    user.collateral.available -= order.margin;
    user.collateral.available += order.margin;
    
    if(!user.positions) {
        user.orders = []
    }

    const newOrder : Order = {
        orderId : Date.now(),
        market : order.market,
        type : order.type,
        qty  : order.qty,
        margin : order.margin,
        orderType : order.orderType,
        price : order.price,
        status : "OPEN"
    }

    const newPosition : Position = {
        positionId : Date.now() + 1,
        userId : user.userId,
        market : order.market,
        type : order.type,
        qty : order.qty,
        margin : order.margin,
        averagePrice : order.price,
        liquidationPrice : order.price * 0.5,
        pnl : 0,
        status : "OPEN"
    } 

    user.orders?.push(newOrder);
    user.positions.push(newPosition);
    res.json({
        message : "order is valid",
        order : order, 
        position : newPosition,
        collateral : user.collateral,
    });
});

app.delete("/order", (req, res) => { })
app.get("/equity/available", (req, res) => { })
app.get("/positions/open/:marketId", (req, res) => { });
app.get("/positions/closed/:marketId", (req, res) => { });
app.get("/orders/open/:marketId", (req, res) => { })
app.get("/orders/:marketId", (req, res) => { })
app.get("/fills", (req, res) => { });

async function liqudationChecks(asset: string, price: number) {

}


async function onPriceUpdateFromBinance(asset: string, price: number) {
    liqudationChecks(asset, price);
}
