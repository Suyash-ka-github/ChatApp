import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { User } from "../model/User.js";
import { generateToken as generateAuthToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";

export const loginUser= TryCatch(async(req,res)=>{
    const {email}=req.body;

    const rateLimitKey=`otp:ratelimit:${email}`;

    const rateLimit=await redisClient.get(rateLimitKey);
    if(rateLimit){
        res.status(429).json({
            message:"Too many requests. Please try again later."
        });
        return;
    }

    const otp=Math.floor(100000+Math.random()*900000).toString();

    const otpKey=`otp:${email}`;
    await redisClient.set(otpKey,otp,{EX:300});
    await redisClient.set(rateLimitKey,"1",{EX:60});

    const message = {
        to: email,
        subject: "Your OTP for Chat App",
        body: `Your OTP is ${otp}. It is valid for 5 minutes.`
    };

    await publishToQueue("send-otp", message);

    res.status(200).json({
        message:"OTP has been sent to your email"
    });
});

export const verifyUser= TryCatch(async(req,res)=>{
    const {email,otp}=req.body;
    if(!email || !otp){
        res.status(400).json({
            message:"Email and OTP are required"
        });
        return;
    }

    const otpKey=`otp:${email}`;
    const storedOtp=await redisClient.get(otpKey);

    if(!storedOtp || storedOtp!==otp){
        res.status(400).json({
            message:"Invalid or expired OTP"
        });
        return;
    }
    await redisClient.del(otpKey);

    let user=await User.findOne({email});
    if(!user){
        const name=email.split("@")[0];
        user=await User.create({name,email});
    }
    
    const token=await generateAuthToken(user);

    res.status(200).json({
        message:"User verified successfully",
        user,
        token
    });
});   

export const myProfile =TryCatch(async(req:AuthenticatedRequest,res)=>{
    const user=req.user;
    
    if(!user){
        res.status(401).json({
            message:"Unauthorized"
        });
        return;
    }
    res.json(user);
});

export const updateName=TryCatch(async(req:AuthenticatedRequest,res)=>{
     if (!req.user) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    const user=await User.findOne({_id:req.user?._id});

    if(!user){
        res.status(401).json({
            message:"Unauthorized"
        });
        return;
    }

    user.name=req.body.name || user.name;
    await user.save();
    const token=await generateAuthToken(user);

    res.status(200).json({
        message:"Name updated successfully",
        user,
        token
    });
});

export const getAllUsers=TryCatch(async(req:AuthenticatedRequest,res)=>{
    const users=await User.find();
    res.json(users);
});


export const getAUser=TryCatch(async(req:AuthenticatedRequest,res)=>{
    const user=await User.findById(req.params.id);
    if(!user){
        res.status(404).json({
            message:"User not found"
        });
    } else {
        res.json(user);
    }
});
