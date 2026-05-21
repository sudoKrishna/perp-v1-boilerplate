import type { Request, Response } from "express";
import { createUser , loginUser } from "../services/userService";
import { prisma } from "../config/db";

export const signup = async(req : Request, res: Response) => {
   try {
     const {username , password} = req.body;
 
     const result = await createUser(username , password);
 
     return res.status(201).json(result);
   } catch (error : any) {
    return res.status(400).json({
        message : error.message
    });
   }
}

export const signin = async(req : Request, res :Response) => {
try {
      const {username , password } = req.body;
    
      const result = await loginUser(username, password);
    
      return res.status(200).json(result);
} catch (error : any) {
    return res.status(400).json({
        message : error.message
    })
}

}
