import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import {createClient} from "redis";
import userRoutes from "./routes/user.js";
import {connectRabbit} from "./config/rabbitmq.js";
import cors from "cors";

dotenv.config();
connectDb();
connectRabbit();

export const redisClient=createClient({
    url: process.env.REDIS_URL!,
});

try {
   await redisClient.connect();
   console.log("connected to Redis");
} catch(err) {
   console.error(err);
}

const app=express();

app.use(express.json());
app.use(cors());
app.use("/api/v1",userRoutes);

const port =process.env.PORT;


app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
});