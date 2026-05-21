import express from "express";
import { placeOrder, cancelOrder } from "../contollers/orderController";

const router = express.Router();

router.post("/", placeOrder);
router.delete("/:id", cancelOrder );

export default router;