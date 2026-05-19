import mongoose,{Document, Schema, Types} from "mongoose";

export interface IMessage extends Document{
    chatId: Types.ObjectId;
    sender: string;
    content?: string;
    image?:{
        url: string
        publicId: string;
    };
    messageType: "text" | "image";
    seen: boolean;
    seenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const schema=new Schema<IMessage>({
    chatId:{type:Schema.Types.ObjectId,ref:"Chat",required:true},
    sender:{type:String,required:true},
    content:{type:String},
    image:{
        url:{type:String},
        publicId:{type:String}
    },
    messageType:{type:String,enum:["text","image"],required:true},
    seen:{type:Boolean,default:false},
},{timestamps:true});

export const Message=mongoose.model<IMessage>("Message",schema);