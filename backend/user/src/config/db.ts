import mongoose from "mongoose";

const connectDb= async()=>{
    const url=process.env.MONGO_URI;

    if(!url){
        throw new Error("MONGO_URI is not defined");
    }

    try{
      await mongoose.connect(url,{
        dbName: "Chatappmicroserviceapp"
      })

      console.log("Connected to mongodb server");

    } catch(error){
        console.error("Failed to connect to Mongo",error);
        process.exit(1);
    }
};

export default connectDb;