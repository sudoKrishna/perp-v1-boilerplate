import type { Request , Response } from "express";
import {createOrder , cancelExistingOrder} from "../services/orderService";

export const placeOrder = async (req : Request, res :Response) => {
    try {
        const result = await createOrder(req.body);
    
        return res.status(201).json(result);
    } catch (error :any) {
        res.status(400).json({
            message : error.message
        })
    }

}

export const cancelOrder = async(req : Request , res : Response) => {
try {
     const result = await cancelExistingOrder(Number(req.params.id));
    
     return res.status(200).json(result);
} catch (error : any) {
    return res.status(400).json({
        message : error.message,
    })
}

}
