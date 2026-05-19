import express from "express";
import {isAuth} from "../middleware/isAuth.js";
import {upload} from "../middleware/multer.js";
import { createNewChat, getAllChats, getMessagesByChat } from "../controllers/chat.js";
import {sendMessage} from "../controllers/chat.js";
import { get } from "mongoose";
const router = express.Router();

router.post("/new",isAuth,createNewChat);
router.get("/all",isAuth,getAllChats);
router.post("/message",isAuth,upload.single("image"),sendMessage);
router.get("/message/:chatId",isAuth,getMessagesByChat);

export default router;