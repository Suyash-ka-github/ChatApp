import express from "express";
import dotenv from "dotenv";
import { startSendOtpEmailConsumer } from "./consumer.js";

dotenv.config();
startSendOtpEmailConsumer();

const app=express();


const port =process.env.PORT;

app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
})