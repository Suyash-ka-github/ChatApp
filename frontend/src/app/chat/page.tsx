'use client'
import ChatSidebar from '@/src/components/ChatSidebar';
import Loading from '@/src/components/Loading';
import { chat_service, useAppData, User } from '@/src/context/AppContext'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import axios from 'axios';
import ChatHeader from '@/src/components/ChatHeader';
import ChatMessages from '@/src/components/ChatMessages';
import MessageInput from '@/src/components/MessageInput';
import { Socket } from 'socket.io-client';
import { SocketData, SocketProvider } from '@/src/context/SocketContext';

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  content?: string;
  image?:{
    url: string;
    public_id: string;
  };
  messageType: 'text' | 'image';
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp = () => {
  const {loading, isAuth, logoutUser, chats, user: loggedInUser, users, fetchChats, setChats,createChat} = useAppData();
  
  const {onlineUsers, socket} = SocketData();


  const [message, setMessage] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);
  const [messages,setMessages] = React.useState<Message[] | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [selectedChat, setSelectedChat] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = React.useState<boolean>(false);
  const [isTyping, setisTyping]= React.useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = React.useState<NodeJS.Timeout | null>(null);
  // const onlineUsers:any=null;
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuth) {
      router.push("/login");
    }
  }, [loading, isAuth]);
  
  const handleLogout = () => logoutUser();
  
  async function fetChat() {
    const token = Cookies.get("token");
    try {
      const {data} = await  axios.get(`${chat_service}/api/v1/chat/message/${selectedUser}`,{
        headers:{
          Authorization:`Bearer ${token}`,
        },
      });
      
      setMessages(data.messages);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  }
   
  const handleMessageSend = async (e:any, imageFile?:File |null) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return toast.error("Message cannot be empty");
    if(!selectedUser) return toast.error("Please select a user to chat with");
    //socket work
    if(typingTimeout){
      clearTimeout(typingTimeout);
      setTypingTimeout(null)
    }

    socket?.emit("stopTyping",{
      chatId: selectedUser,
      userId: loggedInUser?._id
    })

    const tokent = Cookies.get("token");
    try {
      const formData = new FormData();

      formData.append("chatId", selectedUser);

      if(message.trim()){
        formData.append("content", message.trim());
      }

      if(imageFile){
        formData.append("image", imageFile);
      }

      const {data} = await axios.post(`${chat_service}/api/v1/chat/message`, formData,{
        headers:{
          Authorization:`Bearer ${tokent}`,
          "Content-Type":"multipart/form-data", 
        },
      });

      setMessages((prev: Message[] | null)=>{
        const currentMessages = prev || [];
        const messageExists = currentMessages.some((msg) => msg._id === data.message._id);
        if (!messageExists) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });
      setMessage("");
      const displayContent = imageFile ? "Sent an image" : message.trim();
    } catch (error) {
      console.log(error);
      toast.error("Failed to send message");
    }
  }

  const handletyping = (value: string) =>{
    setMessage(value)

    if(!selectedUser || !socket) return ;
     
    //socket setup
    if(value.trim()){
       socket.emit("typing",{
        chatId: selectedUser,
        userId: loggedInUser?._id,
       });
    }

    if(typingTimeout){
      clearTimeout(typingTimeout)
    }
    const timeout= setTimeout(()=>{
      socket.emit("stopTyping",{
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    },2000)

    setTypingTimeout(timeout);
  };
  useEffect(()=>{
    socket?.on("userTyping",(data)=>{
      console.log("recieved user typing",data);
      if(data.chatId === selectedUser && data.userId!=loggedInUser?._id){
         setisTyping(true);
      }
    });

     socket?.on("userStoppedTyping",(data)=>{
      console.log("recieved user stopped typing",data);
      if(data.chatId === selectedUser && data.userId!=loggedInUser?._id){
         setisTyping(false);
      }
    });

    return ()=>{
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
    }
  },[socket, selectedUser, loggedInUser?._id])

  useEffect(()=>{
    if(selectedUser){
      fetChat();
      setisTyping(false);

      socket?.emit("joinChat", selectedUser);

      return ()=>{
        socket?.emit("leaveChat",selectedUser);
        setMessage("");
      };
    }
  },[selectedUser, socket]);

  useEffect(()=>{
    return ()=>{
      if(typingTimeout){
        clearTimeout(typingTimeout);
      }
    }
  },[typingTimeout]);

  if(loading) return <Loading />;
  return (
    <div className='min-h-screen flex bg-gray-900 text-white relative overflow-hidden'>
      <ChatSidebar sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUsers}
        setShowAllUsers={setShowAllUsers}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
         />
         <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10">
         <ChatHeader user={user}
          setSidebarOpen={setSidebarOpen}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
          />
         <ChatMessages selectedUser={selectedUser} messages={messages} loggedInUser={loggedInUser} />
         <MessageInput selectedUser={selectedUser} message={message} setMessage={setMessage} handleMessageSend={handleMessageSend} handletyping={handletyping} />
         </div>
    </div>
  )
}

export default ChatApp;

