type Side = "BUY" | "SELL";
type OrderType = "LIMIT" | "MARKET";

type Order = {
    id: string;
    userId: number;
    price?: number;
    market  : string;
    qty: number;
    side: Side;
    type: OrderType;
    createdAt: number;
};

type OrderBook = {
    bids: Order[];
    asks: Order[];
};

type Trade = {
    buyOrderId: string;
    sellOrderId: string;
    buyerUserId: number;
    sellerUserId: number;
    price: number;
    qty: number;
};

export class TradeEngin {
    private orderBook: OrderBook = {
        bids: [],
        asks: [],
    };

    public getOrderBook() {
        return this.orderBook;
    }

    private matchMarketBuy(order: Order): Trade[] {
        const trades: Trade[] = [];
        while (order.qty > 0 && this.orderBook.asks.length > 0) {
            const bestAsk = this.orderBook.asks[0]!;
            const tradedQty = Math.min(order.qty, bestAsk.qty);
            trades.push({
                buyOrderId: order.id,
                sellOrderId: bestAsk.id,
                 buyerUserId: order.userId,
                 sellerUserId: bestAsk.userId,
                price: bestAsk.price!,
                qty: tradedQty,
            });
            order.qty -= tradedQty;
            bestAsk.qty -= tradedQty;
            if (bestAsk.qty === 0) {
                this.orderBook.asks.shift();
            }
        }
        return trades;
    }

    private matchMarketSell(order: Order): Trade[] {
        const trades: Trade[] = [];
        while (order.qty > 0 && this.orderBook.bids.length > 0) {
            const bestBid = this.orderBook.bids[0]!;
            const tradedQty = Math.min(order.qty, bestBid.qty);
            trades.push({
                buyOrderId: bestBid.id,
                sellOrderId: order.id,
                buyerUserId: order.userId,
                sellerUserId: bestBid.userId,
                price: bestBid.price!,
                qty: tradedQty,
            });
            order.qty -= tradedQty;
            bestBid.qty -= tradedQty;
            if (bestBid.qty === 0) {
                this.orderBook.bids.shift();
            }
        }
        return trades;
    }

    public processOrder(order: Order): Trade[] {
        if (order.type === "LIMIT" && order.price === undefined) {
            throw new Error("LIMIT orders must have a price");
        }
        if (order.type === "MARKET") {
            return order.side === "BUY"
                ? this.matchMarketBuy(order)
                : this.matchMarketSell(order);
        }
        return order.side === "BUY"
            ? this.matchBuy(order)
            : this.matchSell(order);
    }

    public cancelOrder(orderId: string): boolean {
        const bidIndex = this.orderBook.bids.findIndex(
            (order) => order.id === orderId
        );
        if (bidIndex !== -1) {
            this.orderBook.bids.splice(bidIndex, 1);
            return true;
        }
        const askIndex = this.orderBook.asks.findIndex(
            (order) => order.id === orderId
        );
        if (askIndex !== -1) {
            this.orderBook.asks.splice(askIndex, 1);
            return true;
        }
        return false;
    }

    private matchBuy(order: Order): Trade[] {
        const trades: Trade[] = [];
        while (
            order.qty > 0 &&
            this.orderBook.asks.length > 0 &&
            order.price! >= this.orderBook.asks[0]!.price!
        ) {
            const bestAsk = this.orderBook.asks[0]!;
            const tradedQty = Math.min(order.qty, bestAsk.qty);
            const tradePrice = bestAsk.price!;
            trades.push({
                buyOrderId: order.id,
                sellOrderId: bestAsk.id,
                buyerUserId: order.userId,
                sellerUserId: bestAsk.userId,
                price: tradePrice,
                qty: tradedQty,
            });
            order.qty -= tradedQty;
            bestAsk.qty -= tradedQty;
            if (bestAsk.qty === 0) {
                this.orderBook.asks.shift();
            }
        }
        if (order.qty > 0) {
            this.insertBid(order);
        }
        return trades;
    }

    private matchSell(order: Order): Trade[] {
        const trades: Trade[] = [];
        while (
            order.qty > 0 &&
            this.orderBook.bids.length > 0 &&
            order.price! <= this.orderBook.bids[0]!.price!
        ) {
            const bestBid = this.orderBook.bids[0]!;
            const tradedQty = Math.min(order.qty, bestBid.qty);
            const tradePrice = bestBid.price!;
            trades.push({
                buyOrderId: bestBid.id,
                sellOrderId: order.id,
                buyerUserId: bestBid.userId,
                sellerUserId: order.userId,
                price: bestBid.price!,
                qty: tradedQty,
            });
            order.qty -= tradedQty;
            bestBid.qty -= tradedQty;
            if (bestBid.qty === 0) {
                this.orderBook.bids.shift();
            }
        }
        if (order.qty > 0) {
            this.insertAsk(order);
        }
        return trades;
    }

    private insertBid(order: Order) {
        this.orderBook.bids.push(order);
        this.orderBook.bids.sort((a, b) => {
            if (b.price! !== a.price!) {
                return b.price! - a.price!;
            }
            return a.createdAt - b.createdAt;
        });
    }

    private insertAsk(order: Order) {
        this.orderBook.asks.push(order);
        this.orderBook.asks.sort((a, b) => {
            if (a.price! !== b.price!) {
                return a.price! - b.price!;
            }
            return a.createdAt - b.createdAt;
        });
    }

    public printBook() {
        console.log("BIDS:", this.orderBook.bids);
        console.log("ASKS:", this.orderBook.asks);
    }
}