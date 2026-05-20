'use client'
import ChatSidebar from '@/src/components/ChatSidebar';
import Loading from '@/src/components/Loading';
import { useAppData, User } from '@/src/context/AppContext'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

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
  const {loading, isAuth, logoutUser, chats, user: loggedInUser, users, fetchChats, setChats} = useAppData();
  const [message, setMessage] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);
  const [messages,setMessages] = React.useState<Message[] | null>(null);
  const [selectedChat, setSelectedChat] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = React.useState<boolean>(false);
  const [isTyping, setisTyping]= React.useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = React.useState<NodeJS.Timeout | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuth) {
      router.push("/login");
    }
  }, [loading, isAuth]);
  
  const handleLogout = () => logoutUser();
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
        // createChat={createChat}
        // onlineUsers={onlineUsers}
         />
    </div>
  )
}

export default ChatApp;

