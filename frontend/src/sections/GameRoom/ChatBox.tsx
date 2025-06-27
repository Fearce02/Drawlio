import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import type { ChatMessage } from "../../types/game";
import { gsap } from "gsap";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentPlayerName: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  currentPlayerName,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      gsap.fromTo(
        chatBoxRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)", delay: 0.4 },
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();

    // Animate new messages
    if (messagesContainerRef.current && messages.length > 0) {
      const lastMessage = messagesContainerRef.current.lastElementChild;
      if (lastMessage) {
        gsap.fromTo(
          lastMessage,
          { x: 20, opacity: 0, scale: 0.9 },
          { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
        );
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");

      // Animate send button
      if (sendButtonRef.current) {
        gsap.fromTo(
          sendButtonRef.current,
          { scale: 1, rotation: 0 },
          {
            scale: 0.9,
            rotation: 15,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
          },
        );
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      ref={chatBoxRef}
      className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full transform"
    >
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat & Guesses
        </h3>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p>No messages yet. Start guessing!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex flex-col space-y-1 ${
                message.playerId === currentPlayerName
                  ? "items-end"
                  : "items-start"
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                  message.isSystemMessage
                    ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 self-center text-center text-sm border border-yellow-200"
                    : message.isCorrectGuess
                      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-md"
                      : message.playerId === currentPlayerName
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                        : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200"
                }`}
              >
                {!message.isSystemMessage && (
                  <div className="text-xs opacity-75 mb-1">
                    {message.playerName}
                  </div>
                )}
                <div className={message.isSystemMessage ? "font-medium" : ""}>
                  {message.message}
                </div>
                {message.isCorrectGuess && (
                  <div className="text-xs font-medium mt-1 flex items-center">
                    <span className="mr-1">✓</span>
                    Correct guess! +10 points
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your guess here..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 focus:shadow-md"
            maxLength={100}
          />
          <button
            ref={sendButtonRef}
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
