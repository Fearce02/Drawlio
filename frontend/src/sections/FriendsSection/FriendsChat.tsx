import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageCircle,
  X,
  Minimize2,
  Users,
  User,
  Circle,
  MessageSquare,
  ArrowLeft,
  Search,
  // UserPlus removed as it's not used
} from "lucide-react";
import { gsap } from "gsap";
import socket from "../../sockets/socket";
import { getFriendsList } from "../../utils/friendsApi";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: "message" | "system" | "direct";
  recipient?: string;
}

interface GameInvitation {
  id: string;
  friendId: string;
  friendUsername: string;
  roomCode: string;
  roomName: string;
  inviterUsername: string;
  timestamp: number;
  status: "pending" | "accepted" | "declined";
}

interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
  unreadCount: number;
  avatar?: string;
}

interface ChatBoxProps {
  roomCode: string;
  username: string;
}

type ChatView = "lobby" | "friends" | "direct-message";

const FriendsChat: React.FC<ChatBoxProps> = ({ roomCode, username }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<{
    [key: string]: ChatMessage[];
  }>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<ChatView>("lobby");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // friendSearchQuery removed as it's not used
  const [invitations, setInvitations] = useState<GameInvitation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock friends data - in real app, this would come from server
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const data = await getFriendsList(token);
        const realFriends: Friend[] = (data.friends || []).map(
          (friend: any) => ({
            id: friend._id,
            username: friend.username,
            isOnline: friend.status === "online",
            lastSeen: friend.status === "offline" ? new Date() : undefined,
            unreadCount: 0, // Will be updated by socket events
            avatar: friend.avatar || friend.firstName?.[0]?.toUpperCase(),
          }),
        );
        setFriends(realFriends);
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      }
    };

    fetchFriends();
  }, [username]);

  // Emit user_online event when component mounts
  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const userId = user.id || user._id;
        if (userId) {
          (socket as any).emit("user_online", { userId });
        }
      } catch (error) {
        console.error("Error emitting user_online:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Listen for incoming messages
    (socket as any).on("chatMessage", (data: ChatMessage) => {
      if (data.type === "direct" && data.recipient === username) {
        // Handle direct message
        const senderId = friends.find((f) => f.username === data.username)?.id;
        if (senderId) {
          setDirectMessages((prev) => ({
            ...prev,
            [senderId]: [...(prev[senderId] || []), data],
          }));

          // Update friend's unread count
          setFriends((prev) =>
            prev.map((f) =>
              f.id === senderId ? { ...f, unreadCount: f.unreadCount + 1 } : f,
            ),
          );
        }
      } else {
        // Handle lobby message
        setMessages((prev) => [...prev, data]);
      }

      if (
        !isOpen ||
        isMinimized ||
        (currentView !== "lobby" && data.type !== "direct")
      ) {
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
    });

    // Listen for typing indicators
    (socket as any).on(
      "userTyping",
      ({
        username: typingUser,
        isTyping: typing,
      }: {
        username: string;
        isTyping: boolean;
      }) => {
        setIsTyping((prev) => {
          if (typing && !prev.includes(typingUser) && typingUser !== username) {
            return [...prev, typingUser];
          } else if (!typing) {
            return prev.filter((user) => user !== typingUser);
          }
          return prev;
        });
      },
    );

    // Listen for friend status updates
    (socket as any).on(
      "friend_status_update",
      ({ userId, status }: { userId: string; status: string }) => {
        setFriends((prev) =>
          prev.map((f) =>
            f.id === userId
              ? {
                  ...f,
                  isOnline: status === "online",
                  lastSeen: status === "offline" ? new Date() : undefined,
                }
              : f,
          ),
        );
      },
    );

    // Listen for game invitations
    (socket as any).on(
      "friendInvited",
      (data: {
        friendId: string;
        friendUsername: string;
        roomCode: string;
        roomName: string;
        inviterUsername: string;
        timestamp: number;
      }) => {
        // Check if this invitation is for the current user
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
          try {
            const user = JSON.parse(userRaw);
            const currentUserId = user.id || user._id;

            if (data.friendId === currentUserId) {
              const invitation: GameInvitation = {
                id: Date.now().toString(),
                ...data,
                status: "pending",
              };

              setInvitations((prev) => [...prev, invitation]);

              // Show notification
              setUnreadCount((prev) => prev + 1);

              // Animate button on new invitation
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
          } catch (error) {
            console.error("Error parsing user data:", error);
          }
        }
      },
    );

    return () => {
      (socket as any).off("chatMessage");
      (socket as any).off("userTyping");
      (socket as any).off("friend_status_update");
      (socket as any).off("friendInvited");
    };
  }, [roomCode, username, isOpen, isMinimized, currentView, friends]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, directMessages, selectedFriend]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      username,
      message: newMessage.trim(),
      timestamp: new Date(),
      type: currentView === "direct-message" ? "direct" : "message",
      recipient: selectedFriend?.username,
    };

    if (currentView === "direct-message" && selectedFriend) {
      // Send direct message
      (socket as any).emit("sendDirectMessage", {
        recipientId: selectedFriend.id,
        message: message,
      });

      // Add to local direct messages
      setDirectMessages((prev) => ({
        ...prev,
        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), message],
      }));
    } else {
      // Send lobby message
      (socket as any).emit("sendChatMessage", {
        roomCode,
        message: message,
      });
    }

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

    // Stop typing indicator
    (socket as any).emit("typing", { roomCode, username, isTyping: false });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!isOpen || isMinimized) return;
    (socket as any).emit("typing", { username, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      (socket as any).emit("typing", { username, isTyping: false });
    }, 2000);
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
      setCurrentView("lobby");
      setSelectedFriend(null);
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

  const switchToFriends = () => {
    setCurrentView("friends");
    setSelectedFriend(null);
  };

  const switchToDirectMessage = (friend: Friend) => {
    setSelectedFriend(friend);
    setCurrentView("direct-message");

    // Mark messages as read
    setFriends((prev) =>
      prev.map((f) => (f.id === friend.id ? { ...f, unreadCount: 0 } : f)),
    );
  };

  const switchToLobby = () => {
    setCurrentView("lobby");
    setSelectedFriend(null);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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

  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onlineFriends = filteredFriends.filter((f) => f.isOnline);
  const offlineFriends = filteredFriends.filter((f) => !f.isOnline);

  const getCurrentMessages = () => {
    if (currentView === "direct-message" && selectedFriend) {
      return directMessages[selectedFriend.id] || [];
    }
    return messages;
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case "friends":
        return "Friends";
      case "direct-message":
        return selectedFriend?.username || "Direct Message";
      default:
        return "Lobby Chat";
    }
  };

  const getTotalUnreadCount = () => {
    return (
      unreadCount +
      friends.reduce((total, friend) => total + friend.unreadCount, 0) +
      invitations.filter((inv) => inv.status === "pending").length
    );
  };

  const handleAcceptInvitation = (invitation: GameInvitation) => {
    // Update invitation status
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === invitation.id
          ? { ...inv, status: "accepted" as const }
          : inv,
      ),
    );

    // Emit accept invitation event
    (socket as any).emit("acceptInvitation", {
      invitationId: invitation.id,
      roomCode: invitation.roomCode,
      username: username,
    });

    // Navigate to the lobby
    window.location.href = `/friends-lobby?roomCode=${invitation.roomCode}`;
  };

  const handleDeclineInvitation = (invitation: GameInvitation) => {
    // Update invitation status
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === invitation.id
          ? { ...inv, status: "declined" as const }
          : inv,
      ),
    );

    // Emit decline invitation event
    (socket as any).emit("declineInvitation", {
      invitationId: invitation.id,
      roomCode: invitation.roomCode,
      username: username,
    });
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
        {getTotalUnreadCount() > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#ef476f] text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            {getTotalUnreadCount() > 9 ? "9+" : getTotalUnreadCount()}
          </div>
        )}

        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>

      {/* Enhanced Chat Modal */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="fixed bottom-28 right-8 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-40"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#118ab2] to-[#06d6a0]">
            <div className="flex items-center space-x-3">
              {currentView !== "lobby" && (
                <button
                  onClick={
                    currentView === "direct-message"
                      ? switchToFriends
                      : switchToLobby
                  }
                  className="text-white/80 hover:text-white transition-colors duration-200 p-1.5 rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                {currentView === "friends" ? (
                  <Users className="w-4 h-4 text-white" />
                ) : currentView === "direct-message" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-white" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">
                  {getHeaderTitle()}
                </h3>
                {currentView === "direct-message" && selectedFriend && (
                  <div className="flex items-center space-x-1">
                    <Circle
                      className={`w-2 h-2 ${selectedFriend.isOnline ? "text-green-300 fill-current" : "text-gray-300"}`}
                    />
                    <p className="text-white/80 text-xs">
                      {selectedFriend.isOnline
                        ? "Online"
                        : `Last seen ${formatLastSeen(selectedFriend.lastSeen!)}`}
                    </p>
                  </div>
                )}
                {currentView === "lobby" &&
                  isTyping.length > 0 &&
                  !isMinimized && (
                    <p className="text-white/80 text-xs">
                      {isTyping.join(", ")}{" "}
                      {isTyping.length === 1 ? "is" : "are"} typing...
                    </p>
                  )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {currentView === "lobby" && (
                <button
                  onClick={switchToFriends}
                  className="text-white/80 hover:text-white transition-colors duration-200 p-1.5 rounded-full hover:bg-white/10 relative"
                >
                  <Users className="w-4 h-4" />
                  {friends.some((f) => f.unreadCount > 0) && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#ef476f] rounded-full"></div>
                  )}
                </button>
              )}

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

          {/* Content Container */}
          {!isMinimized && (
            <>
              {/* Friends List View */}
              {currentView === "friends" && (
                <div className="messages-container h-64 overflow-y-auto bg-gray-50">
                  {/* Search Bar */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-sm"
                      />
                    </div>
                  </div>

                  {/* Online Friends */}
                  {onlineFriends.length > 0 && (
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        Online ({onlineFriends.length})
                      </h4>
                      <div className="space-y-2">
                        {onlineFriends.map((friend) => (
                          <div
                            key={friend.id}
                            onClick={() => switchToDirectMessage(friend)}
                            className="flex items-center justify-between p-3 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-r from-[#118ab2] to-[#06d6a0] rounded-full flex items-center justify-center text-white font-bold">
                                  {friend.avatar ||
                                    friend.username[0].toUpperCase()}
                                </div>
                                <Circle className="absolute -bottom-1 -right-1 w-4 h-4 text-green-500 fill-current bg-white rounded-full" />
                              </div>
                              <div>
                                <p className="font-medium text-[#073b4c] group-hover:text-[#118ab2] transition-colors">
                                  {friend.username}
                                </p>
                                <p className="text-xs text-green-500 font-medium">
                                  Online
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {friend.unreadCount > 0 && (
                                <div className="w-5 h-5 bg-[#ef476f] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {friend.unreadCount}
                                </div>
                              )}
                              <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-[#118ab2] transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offline Friends */}
                  {offlineFriends.length > 0 && (
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        Offline ({offlineFriends.length})
                      </h4>
                      <div className="space-y-2">
                        {offlineFriends.map((friend) => (
                          <div
                            key={friend.id}
                            onClick={() => switchToDirectMessage(friend)}
                            className="flex items-center justify-between p-3 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 group opacity-75"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                                  {friend.avatar ||
                                    friend.username[0].toUpperCase()}
                                </div>
                                <Circle className="absolute -bottom-1 -right-1 w-4 h-4 text-gray-400 fill-current bg-white rounded-full" />
                              </div>
                              <div>
                                <p className="font-medium text-[#073b4c] group-hover:text-[#118ab2] transition-colors">
                                  {friend.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {friend.lastSeen
                                    ? formatLastSeen(friend.lastSeen)
                                    : "Offline"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {friend.unreadCount > 0 && (
                                <div className="w-5 h-5 bg-[#ef476f] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {friend.unreadCount}
                                </div>
                              )}
                              <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-[#118ab2] transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Game Invitations */}
                  {invitations.filter((inv) => inv.status === "pending")
                    .length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        Game Invitations (
                        {
                          invitations.filter((inv) => inv.status === "pending")
                            .length
                        }
                        )
                      </h4>
                      <div className="space-y-2">
                        {invitations
                          .filter((inv) => inv.status === "pending")
                          .map((invitation) => (
                            <div
                              key={invitation.id}
                              className="p-3 bg-gradient-to-r from-[#ffd166] to-[#ffcc4d] rounded-xl border border-yellow-200"
                            >
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 bg-[#ef476f] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  🎮
                                </div>
                                <div>
                                  <p className="font-medium text-[#073b4c] text-sm">
                                    {invitation.roomName}
                                  </p>
                                  <p className="text-xs text-[#073b4c]/70">
                                    Invited by {invitation.inviterUsername}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleAcceptInvitation(invitation)
                                  }
                                  className="flex-1 bg-[#06d6a0] text-white py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-[#05c090] transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeclineInvitation(invitation)
                                  }
                                  className="flex-1 bg-gray-300 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-gray-400 transition-colors"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {filteredFriends.length === 0 &&
                    invitations.filter((inv) => inv.status === "pending")
                      .length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium text-[#073b4c] mb-1">
                          No friends found
                        </p>
                        <p className="text-xs">Try adjusting your search</p>
                      </div>
                    )}
                </div>
              )}

              {/* Messages Container (Lobby or Direct) */}
              {(currentView === "lobby" ||
                currentView === "direct-message") && (
                <div className="messages-container h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {getCurrentMessages().length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium text-[#073b4c] mb-1">
                        {currentView === "direct-message"
                          ? "Start a conversation"
                          : "Welcome to the lobby!"}
                      </p>
                      <p className="text-xs">
                        {currentView === "direct-message"
                          ? "Send a message to get started"
                          : "Start chatting with other players"}
                      </p>
                    </div>
                  ) : (
                    getCurrentMessages().map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${getMessageAlignment(msg.username)} chat-message`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 ${getMessageColor(msg.username)} shadow-sm`}
                        >
                          {msg.username !== username &&
                            msg.type !== "system" &&
                            currentView === "lobby" && (
                              <p className="text-xs font-bold text-[#118ab2] mb-1 uppercase tracking-wide">
                                {msg.username}
                              </p>
                            )}
                          <p className="text-sm leading-relaxed">
                            {msg.message}
                          </p>
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
              {(currentView === "lobby" ||
                currentView === "direct-message") && (
                <div className="input-container p-4 bg-white border-t border-gray-100">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center space-x-3"
                  >
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder={
                        currentView === "direct-message"
                          ? `Message ${selectedFriend?.username}...`
                          : "Type your message..."
                      }
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-sm transition-all duration-300 focus:scale-105 bg-gray-50 focus:bg-white"
                      maxLength={200}
                      onFocus={(e) => {
                        gsap.to(e.currentTarget, {
                          scale: 1.02,
                          duration: 0.3,
                        });
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
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FriendsChat;
