import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
    host :  process.env.REDIS_HOST,
});

redis.on("connect", () => {
    console.log("redis connected")
})

redis.on("error" , (err) => {
    console.log("redis error:" , err)
}) 

