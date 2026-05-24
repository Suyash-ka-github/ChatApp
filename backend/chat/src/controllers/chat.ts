import axios from "axios";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Message } from "../models/Messages.js";
import { getRecieverSocketId, io } from "../config/socket.js";

export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    // Logic to create a new chat
    const userId = req.user?._id;
    const { recipientId } = req.body;

    if (!recipientId) {
        res.status(400).json({ message: "Recipient ID is required" });
        return;
    }

    const existingChat = await Chat.findOne({
        users: { $all: [userId, recipientId], $size: 2 },
    });

    if (existingChat) {
        res.status(400).json({ message: "Chat already exists", chatId: existingChat._id });
        return;
    }

    const newChat = await Chat.create({
        users: [userId, recipientId],
    });

    res.status(201).json({ message: "Chat created successfully", chatId: newChat._id });


});

export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
    // Logic to get all chats for the authenticated user
    const userId = req.user?._id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

    const chatwithUserData = await Promise.all(

        chats.map(async (chat) => {

            const otherUserId = chat.users.find(
                (id) => id.toString() !== userId.toString()
            );

            if (!otherUserId) {
                return null;
            }

            const unseenCount = await Message.countDocuments({
                chatId: chat._id,
                seen: false,
                sender: otherUserId,
            });

            try {

                const token = req.headers.authorization!;

                const { data } = await axios.get(
                    `${process.env.USER_SERVICE_URL}/api/v1/user/${otherUserId}`,
                    {
                        headers: {
                            Authorization: token,
                        },
                    }
                );

                return {
                    user: data,
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    }
                };

            } catch (err) {

                console.error(
                    `Failed to fetch user data for userId: ${otherUserId}`,
                    err
                );

                return {
                    user: {
                        _id: otherUserId,
                        name: "Unknown User",
                    }
                };
            }
        }
        ));
    res.status(200).json({ chats: chatwithUserData });
});

export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
    // Logic to send a message in a chat
    const userId = req.user?._id;
    const { chatId, content } = req.body;
    const imageFile: any = req.file || null;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (!chatId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (!content && !imageFile) {
        res.status(400).json({ message: "Message content or image is required" });
        return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
    }

    const isUserInChat = chat.users.some((id) => id.toString() === userId.toString());

    if (!isUserInChat) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    const recipentId = chat.users.find((id) => id.toString() !== userId.toString());
    if (!recipentId) {
        res.status(404).json({ message: "Recipient not found in chat" });
        return;
    }

    //socket setup
    const receiverSocketId = getRecieverSocketId(recipentId.toString());
    let isReceiverInChatRoom = false;
    if (receiverSocketId) {
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if (receiverSocket && receiverSocket.rooms.has(chatId)) {
            isReceiverInChatRoom = true;
        }
    }
    let messageData: any = {
        chatId,
        sender: userId,
        seen: isReceiverInChatRoom,
        seenAt: isReceiverInChatRoom ? new Date() : undefined,
    };

    if (imageFile) {
        messageData.image = {
            url: imageFile.path,
            publicId: imageFile.filename,
        };
        messageData.messageType = "image";
        messageData.content = content || "";
    } else {
        messageData.content = content;
        messageData.messageType = "text";
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();
    const latestMessageText = imageFile ? "image" : content;

    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: {
            content: latestMessageText,
            sender: userId,
        },
        updatedAt: new Date(),
    }, { new: true });
    //emit to socket
    io.to(chatId).emit("newMessage", savedMessage);

    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", savedMessage);
    }

    const senderSocketId = getRecieverSocketId(userId.toString());
    if (senderSocketId) {
        io.to(senderSocketId).emit("newMessage", savedMessage);
    }

    if (isReceiverInChatRoom && senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
            chatId: chatId,
            seenBy: receiverSocketId,
            messageIds: [savedMessage._id],
        });
    }
    res.status(201).json({
        message: savedMessage,
        sender: userId,
    });
});

export const getMessagesByChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    // Logic to get messages for a specific chat
    const userId = req.user?._id;
    const { chatId } = req.params;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (!chatId) {
        res.status(400).json({ message: "Chat ID is required" });
        return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
    }
    const isUserInChat = chat.users.some((id) => id.toString() === userId.toString());

    if (!isUserInChat) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    const messagesToMarkSeen = await Message.find({
        chatId,
        seen: false,
        sender: { $ne: userId },
    });

    await Message.updateMany(
        {
            chatId,
            seen: false,
            sender: { $ne: userId },
        },
        { seen: true, seenAt: new Date() }
    );

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    const recipientId = chat.users.find((id) => id.toString() !== userId.toString());
    if (recipientId) {
        try {
            const { data } = await axios.get(
                `${process.env.USER_SERVICE_URL}/api/v1/user/${recipientId}`,
                {
                    headers: {
                        Authorization: req.headers.authorization!,
                    },
                }
            );
            if (!recipientId) {
                res.status(404).json({ message: "Recipient not found" });
                return;
            }
            //socket work
            if (messagesToMarkSeen.length > 0) {
                const otherUserSocketId = getRecieverSocketId(recipientId.toString());
                if (otherUserSocketId) {
                    io.to(otherUserSocketId).emit("messagesSeen", {
                        chatId: chatId,
                        seenBy: userId,
                        messageIds: messagesToMarkSeen.map((msg) => msg._id),
                    });
                }
            }
            res.json({ messages, user: data });
        } catch (error) {
            console.error(`Failed to fetch user data for recipientId: ${recipientId}`, error);
            res.status(500).json({ message: "Error occurred while fetching messages" });
        }
    }

});