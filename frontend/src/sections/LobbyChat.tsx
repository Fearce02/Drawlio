import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { gsap } from "gsap";
import socket from "../sockets/socket";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: "message" | "system";
  avatar?: string;
}

interface ChatBoxProps {
  roomCode: string;
  username: string;
  avatar?: string;
}

const LobbyChat: React.FC<ChatBoxProps> = ({ roomCode, username, avatar }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    socket.on(
      "guest_lobby_chat",
      (data: {
        roomCode: string;
        username: string;
        message: string;
        timestamp: number;
        avatar?: string;
      }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `${data.username}-${data.timestamp}`,
            username: data.username,
            message: data.message,
            timestamp: new Date(data.timestamp),
            type: "message",
            avatar: data.avatar,
          },
        ]);

        if (!isOpen || isMinimized) {
          setUnreadCount((prev) => prev + 1);
          if (buttonRef.current) {
             gsap.fromTo(buttonRef.current, { scale: 1 }, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 });
          }
        }
      },
    );

    return () => {
      socket.off("guest_lobby_chat");
    };
  }, [roomCode, username, isOpen, isMinimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit("guest_lobby_chat", {
      roomCode,
      username,
      message: newMessage.trim(),
      avatar,
    });

    setNewMessage("");
  };

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
      
      // Animate In
      setTimeout(() => {
          if (chatContainerRef.current) {
            gsap.fromTo(chatContainerRef.current, 
                { opacity: 0, scale: 0.9, y: 20 }, 
                { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }
            );
          }
      }, 10);
      
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        ref={buttonRef}
        onClick={toggleChat}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#6750A4] text-white rounded-2xl shadow-lg shadow-[#6750A4]/40 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-[#523E8E] hover:rotate-3 z-50 hover:rounded-xl"
      >
        <MessageCircle size={32} />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#B3261E] border-2 border-[#FDF8FC] text-white rounded-full flex items-center justify-center text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className={`fixed bottom-28 right-8 w-96 bg-[#FDF8FC] rounded-[28px] shadow-2xl overflow-hidden z-40 border border-[#CAC4D0] flex flex-col transition-all duration-300 ${isMinimized ? "h-[80px]" : "h-[500px]"}`}
        >
          {/* Header */}
          <div className="bg-[#6750A4] p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="flex items-center gap-3">
                 <div className="bg-[#EADDFF] w-10 h-10 rounded-full flex items-center justify-center text-[#21005D]">
                    <MessageCircle size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-white text-sm">Lobby Chat</h3>
                    <p className="text-[#EADDFF] text-xs">Global Room</p>
                 </div>
            </div>
            <div className="flex gap-1">
                 <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 text-[#EADDFF] hover:text-white hover:bg-white/10 rounded-full">
                    {isMinimized ? <Maximize2 size={18}/> : <Minimize2 size={18}/>}
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); toggleChat(); }} className="p-2 text-[#EADDFF] hover:text-white hover:bg-white/10 rounded-full">
                    <X size={18}/>
                 </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4">
             {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-[#49454F] opacity-50">
                     <MessageCircle size={48} className="mb-2"/>
                     <p className="text-sm">No messages yet</p>
                 </div>
             )}
             {messages.map(msg => {
                 const isMe = msg.username === username;
                 return (
                     <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                         <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {/* Avatar */}
                            {msg.avatar && (
                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-[#EADDFF] mb-1">
                                    <img src={msg.avatar} alt={msg.username} className="w-full h-full object-cover" />
                                </div>
                            )}
                             <div className={`rounded-2xl px-4 py-3 ${
                                 isMe 
                                 ? "bg-[#6750A4] text-white rounded-br-none" 
                                 : "bg-[#F3EDF7] text-[#1C1B1F] rounded-bl-none"
                             }`}>
                                 {!isMe && <p className="text-xs font-bold text-[#6750A4] mb-1">{msg.username}</p>}
                                 <p className="text-sm">{msg.message}</p>
                                 <p className={`text-[10px] mt-1 opacity-70 ${isMe ? "text-[#EADDFF]" : "text-[#49454F]"}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                             </div>
                         </div>
                     </div>
                 )
             })}
             <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-[#E7E0EC]">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                    ref={chatInputRef}
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 bg-[#F3EDF7] rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6750A4] text-[#1C1B1F] placeholder-[#49454F]/60"
                />
                <button 
                    disabled={!newMessage.trim()}
                    type="submit"
                    className="bg-[#6750A4] text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#523E8E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} className="ml-0.5" />
                </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LobbyChat;
