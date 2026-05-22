import { describe, it, expect, beforeEach } from "vitest";
import { TradeEngin } from "../src/services/tradeEngine";

describe("Order Cancellation", () => {
    let engine: TradeEngin;

    beforeEach(() => {
        engine = new TradeEngin();
    });

    it("should cancel resting buy order before execution", () => {
        engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: Date.now(),
        });

        engine.cancelOrder("b1");

        const book = engine.getOrderBook();

        expect(book.bids.length).toBe(0);
    });

    it("should not match the cancelled order", () => {
        engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: Date.now(),
        });

        engine.cancelOrder("b1");

        const trades = engine.processOrder({
            id: "s1",
            userId: 2,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: Date.now(),
        });

        expect(trades).toEqual([]);
    });
});

describe("TradeEngine", () => {
    let engine: TradeEngin;

    beforeEach(() => {
        engine = new TradeEngin();
    });

    it("should insert buy order when no asks exist", () => {
        const trades = engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: Date.now(),
        });

        expect(trades).toEqual([]);
    });

    it("should insert sell order when no bids exist", () => {
        const trades = engine.processOrder({
            id: "s1",
            userId: 2,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: Date.now(),
        });

        expect(trades).toEqual([]);
    });

    it("should full match buy and sell order", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        const trades = engine.processOrder({
            id: "b1",
            userId: 2,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        expect(trades).toEqual([
            {
                buyOrderId: "b1",
                sellOrderId: "s1",
                price: 100,
                qty: 5,
            },
        ]);
    });

    it("should partially fill buy order", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 100,
            qty: 3,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        const trades = engine.processOrder({
            id: "b1",
            userId: 2,
            price: 100,
            qty: 10,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        expect(trades).toEqual([
            {
                buyOrderId: "b1",
                sellOrderId: "s1",
                price: 100,
                qty: 3,
            },
        ]);
    });

    it("should partially fill sell order", () => {
        engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 3,
            side: "BUY",
            type: "LIMIT",
            createdAt: 1,
        });

        const trades = engine.processOrder({
            id: "s1",
            userId: 2,
            price: 100,
            qty: 10,
            side: "SELL",
            type: "LIMIT",
            createdAt: 2,
        });

        expect(trades).toEqual([
            {
                buyOrderId: "b1",
                sellOrderId: "s1",
                price: 100,
                qty: 3,
            },
        ]);
    });

    it("should match best ask first", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 105,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        engine.processOrder({
            id: "s2",
            userId: 2,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 2,
        });

        const trades = engine.processOrder({
            id: "b1",
            userId: 3,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 3,
        });

        expect(trades[0]!.sellOrderId).toBe("s2");
        expect(trades[0]!.price).toBe(100);
    });

    it("should match highest bid first", () => {
        engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 1,
        });

        engine.processOrder({
            id: "b2",
            userId: 2,
            price: 105,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        const trades = engine.processOrder({
            id: "s1",
            userId: 3,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 3,
        });

        expect(trades[0]!.buyOrderId).toBe("b2");
        expect(trades[0]!.sellOrderId).toBe("s1");
    });

    it("match multiple asks", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        engine.processOrder({
            id: "s2",
            userId: 2,
            price: 101,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 2,
        });

        const trades = engine.processOrder({
            id: "b1",
            userId: 3,
            price: 101,
            qty: 10,
            side: "BUY",
            type: "LIMIT",
            createdAt: 3,
        });

        expect(trades.length).toBe(2);

        expect(trades[0]).toEqual({
            buyOrderId: "b1",
            sellOrderId: "s1",
            price: 100,
            qty: 5,
        });

        expect(trades[1]).toEqual({
            buyOrderId: "b1",
            sellOrderId: "s2",
            price: 101,
            qty: 5,
        });
    });

    it("should not match if prices do not cross", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 110,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        const trades = engine.processOrder({
            id: "b1",
            userId: 2,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        expect(trades).toEqual([]);
    });

    it("should handle zero quantity", () => {
        const trades = engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 0,
            side: "BUY",
            type: "LIMIT",
            createdAt: Date.now(),
        });

        expect(trades).toEqual([]);
    });

    it("should handle exact quantity match", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 100,
            qty: 7,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        const trades = engine.processOrder({
            id: "b1",
            userId: 2,
            price: 100,
            qty: 7,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        expect(trades[0]!.qty).toBe(7);
    });

    it("remaining qty should stay in orderbook", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 100,
            qty: 10,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        engine.processOrder({
            id: "b1",
            userId: 2,
            price: 100,
            qty: 3,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        const book = engine.getOrderBook();

        expect(book.asks[0]!.qty).toBe(7);
        expect(book.bids.length).toBe(0);
    });
});

describe("Market Order", () => {
    let engine: TradeEngin;

    beforeEach(() => {
        engine = new TradeEngin();
    });

    it("market buy should match best available asks", () => {
        engine.processOrder({
            id: "s1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 1,
        });

        engine.processOrder({
            id: "s2",
            userId: 2,
            price: 101,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 2,
        });

        const trades = engine.processOrder({
            id: "m1",
            qty: 5,
            userId: 3,
            side: "BUY",
            type: "MARKET",
            createdAt: 3,
        });

        expect(trades[0]!.sellOrderId).toBe("s1");
    });

    it("market sell should match highest bids first", () => {
        engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 1,
        });

        engine.processOrder({
            id: "b2",
            userId: 2,
            price: 105,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        const trades = engine.processOrder({
            id: "m1",
            qty: 5,
            userId: 3,
            side: "SELL",
            type: "MARKET",
            createdAt: 3,
        });

        expect(trades[0]!.buyOrderId).toBe("b2");
    });
});

describe("FIFO Priority", () => {
    let engine: TradeEngin;

    beforeEach(() => {
        engine = new TradeEngin();
    });

    it("earlier order should execute first", () => {
        engine.processOrder({
            id: "b1",
            userId: 1,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 1,
        });

        engine.processOrder({
            id: "b2",
            userId: 2,
            price: 100,
            qty: 5,
            side: "BUY",
            type: "LIMIT",
            createdAt: 2,
        });

        const trades = engine.processOrder({
            id: "s1",
            userId: 3,
            price: 100,
            qty: 5,
            side: "SELL",
            type: "LIMIT",
            createdAt: 3,
        });

        expect(trades[0]!.buyOrderId).toBe("b1");
    });
});

describe("Heap Performance", () => {
    let engine: TradeEngin;

    beforeEach(() => {
        engine = new TradeEngin();
    });

    it("should process large number of orders efficiently", () => {
        const start = Date.now();

        for (let i = 0; i < 5000; i++) {
            engine.processOrder({
                id: `b${i}`,
                userId: i,
                price: 100,
                qty: 1,
                side: "BUY",
                type: "LIMIT",
                createdAt: i,
            });
        }

        for (let i = 0; i < 5000; i++) {
            engine.processOrder({
                id: `s${i}`,
                userId: i,
                price: 100,
                qty: 1,
                side: "SELL",
                type: "LIMIT",
                createdAt: i,
            });
        }

        const end = Date.now();

        expect(end - start).toBeLessThan(2000);
    });
});

describe("Stress Test - 10k Orders", () => {
    let engine: TradeEngin;

    beforeEach(() => {
        engine = new TradeEngin();
    });

    it("should handle high throughput order flow", () => {
        const orders = [];

        for (let i = 0; i < 10000; i++) {
            orders.push({
                id: `o${i}`,
                userId: i,
                price: 100 + (i % 10),
                qty: 1,
                side: i % 2 === 0 ? "BUY" as const : "SELL" as const,
                type: "LIMIT" as const,
                createdAt: i,
            });
        }

        const start = performance.now();

        for (const order of orders) {
            engine.processOrder(order);
        }

        const end = performance.now();

        expect(end - start).toBeLessThan(3000);
    });
});