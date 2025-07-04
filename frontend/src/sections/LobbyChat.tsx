import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, X, Minimize2 } from "lucide-react";
import { gsap } from "gsap";
import socket from "../sockets/socket";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: "message" | "system";
}

interface ChatBoxProps {
  roomCode: string;
  username: string;
}

const LobbyChat: React.FC<ChatBoxProps> = ({ roomCode, username }) => {
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
    // Listen for incoming messages
    socket.on(
      "guest_lobby_chat",
      (data: {
        roomCode: string;
        username: string;
        message: string;
        timestamp: number;
      }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `${data.username}-${data.timestamp}`,
            username: data.username,
            message: data.message,
            timestamp: new Date(data.timestamp),
            type: "message",
          },
        ]);

        if (!isOpen || isMinimized) {
          setUnreadCount((prev) => prev + 1);

          // Animate button on new message
          if (buttonRef.current) {
            gsap.to(buttonRef.current, {
              scale: 1.1,
              duration: 0.2,
              yoyo: true,
              repeat: 1,
              ease: "power2.inOut",
            });
          }
        }

        // Animate new message
        setTimeout(() => {
          const messageElements = document.querySelectorAll(".chat-message");
          const lastMessage = messageElements[messageElements.length - 1];
          if (lastMessage) {
            gsap.fromTo(
              lastMessage,
              { opacity: 0, y: 20, scale: 0.95 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.7)",
              },
            );
          }
        }, 50);
      },
    );

    return () => {
      socket.off("guest_lobby_chat");
    };
  }, [roomCode, username, isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Emit to server using guest_lobby_chat event
    socket.emit("guest_lobby_chat", {
      roomCode,
      username,
      message: newMessage.trim(),
    });

    // Clear input with animation
    if (chatInputRef.current) {
      gsap.to(chatInputRef.current, {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }

    setNewMessage("");
  };

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);

      // Animate chat container entrance
      if (chatContainerRef.current) {
        gsap.fromTo(
          chatContainerRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
        );
      }
    } else {
      setIsOpen(false);
      setIsMinimized(false);
    }

    // Animate button
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);

    // Animate minimize/maximize
    if (chatContainerRef.current) {
      const messagesContainer = chatContainerRef.current.querySelector(
        ".messages-container",
      );
      const inputContainer =
        chatContainerRef.current.querySelector(".input-container");

      if (isMinimized) {
        // Expanding
        gsap.to([messagesContainer, inputContainer], {
          height: "auto",
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        // Minimizing
        gsap.to([messagesContainer, inputContainer], {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getMessageColor = (msgUsername: string) => {
    if (msgUsername === username) return "bg-[#118ab2] text-white";
    if (msgUsername === "System")
      return "bg-gray-100 text-gray-600 text-center";
    return "bg-white text-[#073b4c] border border-gray-200";
  };

  const getMessageAlignment = (msgUsername: string) => {
    if (msgUsername === "System") return "justify-center";
    return msgUsername === username ? "justify-end" : "justify-start";
  };

  return (
    <>
      {/* Chat Button */}
      <button
        ref={buttonRef}
        onClick={toggleChat}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-[#118ab2] to-[#06d6a0] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:shadow-3xl z-50 group"
        onMouseEnter={(e) => {
          gsap.to(e.currentTarget, { y: -3, duration: 0.3 });
          gsap.to(e.currentTarget.querySelector(".chat-icon"), {
            rotate: 15,
            scale: 1.1,
            duration: 0.3,
          });
        }}
        onMouseLeave={(e) => {
          gsap.to(e.currentTarget, { y: 0, duration: 0.3 });
          gsap.to(e.currentTarget.querySelector(".chat-icon"), {
            rotate: 0,
            scale: 1,
            duration: 0.3,
          });
        }}
      >
        <MessageCircle className="w-7 h-7 chat-icon transition-all duration-300" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#ef476f] text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}

        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>

      {/* Compact Chat Modal */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="fixed bottom-28 right-8 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-40"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#118ab2] to-[#06d6a0]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Lobby Chat</h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMinimize}
                className="text-white/80 hover:text-white transition-colors duration-200 p-1.5 rounded-full hover:bg-white/10"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2 });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.2 });
                }}
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-colors duration-200 p-1.5 rounded-full hover:bg-white/10"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { rotate: 90, duration: 0.3 });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { rotate: 0, duration: 0.3 });
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          {!isMinimized && (
            <div className="messages-container h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-[#073b4c] mb-1">
                    Welcome to the lobby!
                  </p>
                  <p className="text-xs">Start chatting with other players</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${getMessageAlignment(msg.username)} chat-message`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${getMessageColor(msg.username)} shadow-sm`}
                    >
                      {msg.username !== username && msg.type !== "system" && (
                        <p className="text-xs font-bold text-[#118ab2] mb-1 uppercase tracking-wide">
                          {msg.username}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      {msg.type !== "system" && (
                        <p
                          className={`text-xs mt-1 ${
                            msg.username === username
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Message Input */}
          {!isMinimized && (
            <div className="input-container p-4 bg-white border-t border-gray-100">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-3"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-sm transition-all duration-300 focus:scale-105 bg-gray-50 focus:bg-white"
                  maxLength={200}
                  onFocus={(e) => {
                    gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
                  }}
                  onBlur={(e) => {
                    gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 bg-gradient-to-r from-[#118ab2] to-[#06d6a0] text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      gsap.to(e.currentTarget.querySelector("svg"), {
                        x: 2,
                        duration: 0.3,
                      });
                    }
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget.querySelector("svg"), {
                      x: 0,
                      duration: 0.3,
                    });
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default LobbyChat;
