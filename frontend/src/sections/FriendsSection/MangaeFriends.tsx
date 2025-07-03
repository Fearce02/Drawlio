import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  UserPlus,
  Search,
  MessageCircle,
  Users,
  MoreVertical,
} from "lucide-react";
import { gsap } from "gsap";
import { fadeInUp, slideInFromLeft, staggerFadeIn } from "../hooks/useGSAP";

interface Friend {
  id: number;
  name: string;
  status: "online" | "offline" | "in-game";
  avatar: string;
}

interface FriendsListProps {
  friends: Friend[];
  onBack: () => void;
}

const ManageFriends: React.FC<FriendsListProps> = ({ friends, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "online" | "offline">(
    "all",
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const friendsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Page entrance animations
    if (headerRef.current) {
      slideInFromLeft(headerRef.current, 0.1);
    }

    if (searchRef.current) {
      fadeInUp(searchRef.current, 0.3);
    }

    if (tabsRef.current) {
      fadeInUp(tabsRef.current, 0.5);
    }

    // Animate friends list
    setTimeout(() => {
      staggerFadeIn(".friend-item", 0.7);
    }, 100);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-[#06d6a0]";
      case "in-game":
        return "bg-[#ffd166]";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "in-game":
        return "In Game";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch = friend.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "online" && friend.status === "online") ||
      (activeTab === "offline" && friend.status === "offline");
    return matchesSearch && matchesTab;
  });

  const onlineCount = friends.filter((f) => f.status === "online").length;
  const offlineCount = friends.filter((f) => f.status === "offline").length;

  const handleTabChange = (tab: "all" | "online" | "offline") => {
    setActiveTab(tab);

    // Re-animate friends list
    gsap.fromTo(
      ".friend-item",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" },
    );
  };

  const handleFriendHover = (e: React.MouseEvent) => {
    gsap.to(e.currentTarget, {
      x: 10,
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleFriendLeave = (e: React.MouseEvent) => {
    gsap.to(e.currentTarget, {
      x: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-3 text-[#073b4c] hover:text-[#ef476f] transition-all duration-300 font-medium transform hover:scale-105"
          onMouseEnter={(e) => {
            gsap.to(e.currentTarget.querySelector("svg"), {
              x: -5,
              duration: 0.3,
            });
          }}
          onMouseLeave={(e) => {
            gsap.to(e.currentTarget.querySelector("svg"), {
              x: 0,
              duration: 0.3,
            });
          }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Back to Home</span>
        </button>
        <button
          className="bg-[#ef476f] text-white px-8 py-4 rounded-full font-bold hover:bg-[#e63946] transition-all duration-300 flex items-center space-x-3 transform hover:scale-105"
          onMouseEnter={(e) => {
            gsap.to(e.currentTarget.querySelector("svg"), {
              rotation: 180,
              duration: 0.3,
            });
          }}
          onMouseLeave={(e) => {
            gsap.to(e.currentTarget.querySelector("svg"), {
              rotation: 0,
              duration: 0.3,
            });
          }}
        >
          <UserPlus className="w-6 h-6" />
          <span>Add Friend</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-[#06d6a0] rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#073b4c]">Friends</h1>
              <p className="text-gray-600 text-lg">
                {friends.length} total • {onlineCount} online
              </p>
            </div>
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
              onFocus={(e) => {
                gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
              }}
              onBlur={(e) => {
                gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
              }}
            />
          </div>

          {/* Tabs */}
          <div
            ref={tabsRef}
            className="flex space-x-2 bg-gray-100 p-2 rounded-full"
          >
            <button
              onClick={() => handleTabChange("all")}
              className={`flex-1 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${
                activeTab === "all"
                  ? "bg-white text-[#ef476f] shadow-md transform scale-105"
                  : "text-gray-600 hover:text-[#073b4c] hover:scale-105"
              }`}
            >
              All ({friends.length})
            </button>
            <button
              onClick={() => handleTabChange("online")}
              className={`flex-1 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${
                activeTab === "online"
                  ? "bg-white text-[#ef476f] shadow-md transform scale-105"
                  : "text-gray-600 hover:text-[#073b4c] hover:scale-105"
              }`}
            >
              Online ({onlineCount})
            </button>
            <button
              onClick={() => handleTabChange("offline")}
              className={`flex-1 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${
                activeTab === "offline"
                  ? "bg-white text-[#ef476f] shadow-md transform scale-105"
                  : "text-gray-600 hover:text-[#073b4c] hover:scale-105"
              }`}
            >
              Offline ({offlineCount})
            </button>
          </div>
        </div>

        {/* Friends List */}
        <div ref={friendsListRef} className="divide-y divide-gray-100">
          {filteredFriends.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#073b4c] mb-4">
                No friends found
              </h3>
              <p className="text-gray-500 text-lg">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Start by adding some friends!"}
              </p>
            </div>
          ) : (
            filteredFriends.map((friend, index) => (
              <div
                key={friend.id}
                className="friend-item p-8 hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                onMouseEnter={handleFriendHover}
                onMouseLeave={handleFriendLeave}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(friend.status)} border-2 border-white rounded-full ${friend.status === "online" ? "animate-pulse" : ""}`}
                      ></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#073b4c] text-xl">
                        {friend.name}
                      </h3>
                      <p
                        className={`text-lg font-medium ${
                          friend.status === "online"
                            ? "text-[#06d6a0]"
                            : friend.status === "in-game"
                              ? "text-[#ffd166]"
                              : "text-gray-500"
                        }`}
                      >
                        {getStatusText(friend.status)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {friend.status === "online" && (
                      <>
                        <button
                          className="p-3 text-gray-600 hover:text-[#118ab2] hover:bg-blue-50 rounded-full transition-all duration-300 transform hover:scale-110"
                          onMouseEnter={(e) => {
                            gsap.to(e.currentTarget.querySelector("svg"), {
                              scale: 1.2,
                              duration: 0.2,
                            });
                          }}
                          onMouseLeave={(e) => {
                            gsap.to(e.currentTarget.querySelector("svg"), {
                              scale: 1,
                              duration: 0.2,
                            });
                          }}
                        >
                          <MessageCircle className="w-6 h-6" />
                        </button>
                        <button
                          className="bg-[#ef476f] text-white px-6 py-3 rounded-full font-bold hover:bg-[#e63946] transition-all duration-300 transform hover:scale-105"
                          onMouseEnter={(e) => {
                            gsap.to(e.currentTarget, { y: -2, duration: 0.2 });
                          }}
                          onMouseLeave={(e) => {
                            gsap.to(e.currentTarget, { y: 0, duration: 0.2 });
                          }}
                        >
                          Invite
                        </button>
                      </>
                    )}
                    <button
                      className="p-3 text-gray-600 hover:text-[#073b4c] hover:bg-gray-100 rounded-full transition-all duration-300 transform hover:scale-110"
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget.querySelector("svg"), {
                          rotation: 90,
                          duration: 0.3,
                        });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget.querySelector("svg"), {
                          rotation: 0,
                          duration: 0.3,
                        });
                      }}
                    >
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageFriends;
