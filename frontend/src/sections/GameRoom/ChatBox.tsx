import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import type { ChatMessage } from "../../types/game";
import { gsap } from "gsap";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentPlayerName: string;
  isCurrentPlayerDrawing: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  currentPlayerName,
  isCurrentPlayerDrawing,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Animate new message
    if (messagesContainerRef.current && messages.length > 0) {
        const lastMessage = messagesContainerRef.current.lastElementChild?.previousElementSibling; // skip spacer
         if (lastMessage) {
              gsap.fromTo(lastMessage, 
                  { opacity: 0, y: 10, scale: 0.95 }, 
                  { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(1.5)" }
              );
         }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");
      
      // Animate Send Button
      if (sendButtonRef.current) {
          gsap.fromTo(sendButtonRef.current, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
      }
    }
  };

  return (
    <div className="bg-[#FDF8FC] rounded-[24px] border border-[#CAC4D0] flex flex-col h-[500px] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 bg-[#F3EDF7] border-b border-[#E7E0EC] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#21005D]">
             <MessageCircle size={16} />
        </div>
        <h3 className="font-bold text-[#1C1B1F] text-sm">Chat & Guesses</h3>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-white/50 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#49454F] opacity-50">
            <MessageCircle size={32} className="mb-2 text-[#EADDFF]" />
            <p className="text-xs">Start guessing!</p>
          </div>
        ) : (
          messages.map((message) => {
             const isMe = message.playerId === currentPlayerName;
             
             if (message.isSystemMessage) {
                 return (
                     <div key={message.id} className="flex justify-center my-2">
                         <span className="bg-[#E7E0EC] text-[#49454F] text-[10px] font-bold px-3 py-1 rounded-full">{message.message}</span>
                     </div>
                 )
             }
             
             if (message.isCorrectGuess) {
                  return (
                      <div key={message.id} className="flex justify-center my-2">
                          <div className="bg-[#E6F4EA] text-[#0D652D] px-4 py-2 rounded-xl text-xs font-bold border border-[#C3EED0] flex items-center gap-2 shadow-sm">
                              <span>🎉</span>
                              <span>{message.playerName} guessed the word!</span>
                          </div>
                      </div>
                  )
             }

             return (
                <div key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`flex items-end gap-2 max-w-[90%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Avatar */}
                        {message.avatar && (
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-[#EADDFF] mb-1">
                                <img src={message.avatar} alt={message.playerName} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className={`px-4 py-2 rounded-2xl text-sm ${
                            isMe 
                            ? "bg-[#6750A4] text-white rounded-br-none"
                            : "bg-[#F3EDF7] text-[#1C1B1F] rounded-bl-none"
                        }`}>
                            {!isMe && <p className="text-[10px] font-bold text-[#6750A4] mb-0.5">{message.playerName}</p>}
                            <p>{message.message}</p>
                        </div>
                    </div>
                </div>
             );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-[#E7E0EC]">
        <div className="relative flex items-center">
            <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isCurrentPlayerDrawing ? "Drawing..." : "Type guess..."}
                disabled={isCurrentPlayerDrawing}
                className="w-full bg-[#F3EDF7] rounded-full pl-5 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6750A4] transition-all placeholder:text-[#49454F]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
                ref={sendButtonRef}
                type="submit"
                disabled={!inputMessage.trim() || isCurrentPlayerDrawing}
                className="absolute right-2 p-2 bg-[#6750A4] text-white rounded-full hover:bg-[#523E8E] transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
                <Send size={14} className="ml-0.5" />
            </button>
        </div>
      </form>
    </div>
  );
};
