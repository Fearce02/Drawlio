import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  UserPlus,
  Search,
  MessageCircle,
  Users,
  MoreVertical,
  X,
  Check,
  UserPlus as AddUserIcon,
} from "lucide-react";
import { gsap } from "gsap";
// @ts-ignore
// import { fadeInUp, slideInFromLeft, staggerFadeIn } from "../hooks/useGSAP";
import {
  getFriendsList,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
} from "../../utils/friendsApi";
import socket from "../../sockets/socket";

interface Friend {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: "online" | "offline" | "in-game";
}

interface UserSearchResult {
  _id: string;
  username: string;
  firstName?: string;
  avatar?: string;
  sent?: boolean;
}

interface ManageFriendsProps {
  onBack: () => void;
}

const ManageFriends: React.FC<ManageFriendsProps> = ({ onBack }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "online" | "offline">(
    "all",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const friendsListRef = useRef<HTMLDivElement>(null);

  // Fetch friends data
  const fetchFriends = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFriendsList(token);
      setFriends(data.friends || []);
      setFriendRequests(data.friendRequests || []);
      setSentRequests(data.sentRequests || []);
    } catch (err) {
      setError("Failed to load friends.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFriends();
    // Real-time: Notify backend this user is online
    if (user && user.id) {
      (socket as any).emit("user_online", { userId: user.id });
    }
    // Listen for friend status updates
    const handleStatusUpdate = ({
      userId,
      status,
    }: {
      userId: string;
      status: string;
    }) => {
      setFriends((prev) =>
        prev.map((f) =>
          f._id === userId ? { ...f, status: status as Friend["status"] } : f,
        ),
      );
      setFriendRequests((prev) =>
        prev.map((f) =>
          f._id === userId ? { ...f, status: status as Friend["status"] } : f,
        ),
      );
      setSentRequests((prev) =>
        prev.map((f) =>
          f._id === userId ? { ...f, status: status as Friend["status"] } : f,
        ),
      );
    };
    (socket as any).on("friend_status_update", handleStatusUpdate);
    return () => {
      (socket as any).off("friend_status_update", handleStatusUpdate);
    };
    // eslint-disable-next-line
  }, []);

  // Search users
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!e.target.value.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { users } = await searchUsers(e.target.value, token);
      setSearchResults(users);
    } catch (err) {
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  // Friend actions
  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId, token);
      fetchFriends();
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, sent: true } : u)),
      );
    } catch {}
  };
  const handleAccept = async (userId: string) => {
    try {
      await acceptFriendRequest(userId, token);
      fetchFriends();
    } catch {}
  };
  const handleReject = async (userId: string) => {
    try {
      await rejectFriendRequest(userId, token);
      fetchFriends();
    } catch {}
  };
  const handleRemove = async (userId: string) => {
    try {
      await removeFriend(userId, token);
      fetchFriends();
    } catch {}
  };

  // Filtering
  const filteredFriends = friends.filter((friend) => {
    const matchesSearch = friend.username
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

  // UI helpers
  const getStatusColor = (status?: string) => {
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
  const getStatusText = (status?: string) => {
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

  const handleFriendHover = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      x: 10,
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleFriendLeave = (e: React.MouseEvent<HTMLDivElement>) => {
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
        {/* Add Friend Search */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-64 pl-4 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
          />
          <UserPlus className="w-6 h-6 text-[#ef476f]" />
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && searchResults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <h3 className="text-xl font-bold mb-2 text-[#073b4c]">
            Search Results
          </h3>
          {searchLoading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {searchResults.map((user) => (
                <li
                  key={user._id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {user.avatar && user.avatar.trim() !== "" ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-blue-400 to-purple-500">
                        {user.firstName && user.firstName[0]
                          ? user.firstName[0].toUpperCase()
                          : user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-[#073b4c]">
                      {user.username}
                    </span>
                  </div>
                  <button
                    className="bg-[#ef476f] text-white px-4 py-2 rounded-full font-bold hover:bg-[#e63946] transition-all duration-300 flex items-center space-x-2"
                    onClick={() => handleSendRequest(user._id)}
                    disabled={user.sent}
                  >
                    <AddUserIcon className="w-4 h-4" />
                    {user.sent ? "Request Sent" : "Add Friend"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div
          ref={tabsRef}
          className="flex space-x-2 bg-gray-100 p-2 rounded-full mb-4"
        >
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${
              activeTab === "all"
                ? "bg-white text-[#ef476f] shadow-md transform scale-105"
                : "text-gray-600 hover:text-[#073b4c] hover:scale-105"
            }`}
          >
            All ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`flex-1 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${
              activeTab === "online"
                ? "bg-white text-[#ef476f] shadow-md transform scale-105"
                : "text-gray-600 hover:text-[#073b4c] hover:scale-105"
            }`}
          >
            Online ({onlineCount})
          </button>
          <button
            onClick={() => setActiveTab("offline")}
            className={`flex-1 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${
              activeTab === "offline"
                ? "bg-white text-[#ef476f] shadow-md transform scale-105"
                : "text-gray-600 hover:text-[#073b4c] hover:scale-105"
            }`}
          >
            Offline ({offlineCount})
          </button>
        </div>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold mb-2 text-[#073b4c]">
              Friend Requests
            </h3>
            <ul>
              {friendRequests.map((user) => (
                <li
                  key={user._id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {user.avatar && user.avatar.trim() !== "" ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-blue-400 to-purple-500">
                        {user.firstName && user.firstName[0]
                          ? user.firstName[0].toUpperCase()
                          : user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-[#073b4c]">
                      {user.username}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-[#06d6a0] text-white px-4 py-2 rounded-full font-bold hover:bg-[#05c293] transition-all duration-300 flex items-center space-x-2"
                      onClick={() => handleAccept(user._id)}
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button
                      className="bg-gray-300 text-[#073b4c] px-4 py-2 rounded-full font-bold hover:bg-gray-400 transition-all duration-300 flex items-center space-x-2"
                      onClick={() => handleReject(user._id)}
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold mb-2 text-[#073b4c]">
              Sent Requests
            </h3>
            <ul>
              {sentRequests.map((user) => (
                <li
                  key={user._id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {user.avatar && user.avatar.trim() !== "" ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-blue-400 to-purple-500">
                        {user.firstName && user.firstName[0]
                          ? user.firstName[0].toUpperCase()
                          : user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-[#073b4c]">
                      {user.username}
                    </span>
                  </div>
                  <button
                    className="bg-gray-300 text-[#073b4c] px-4 py-2 rounded-full font-bold hover:bg-gray-400 transition-all duration-300 flex items-center space-x-2"
                    onClick={() => handleReject(user._id)}
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Friends List */}
        <div ref={friendsListRef} className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-16 text-center">Loading...</div>
          ) : error ? (
            <div className="p-16 text-center text-red-500">{error}</div>
          ) : filteredFriends.length === 0 ? (
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
                key={friend._id}
                className="friend-item p-8 hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                onMouseEnter={handleFriendHover}
                onMouseLeave={handleFriendLeave}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {friend.avatar && friend.avatar.trim() !== "" ? (
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-blue-400 to-purple-500">
                          {friend.firstName && friend.firstName[0]
                            ? friend.firstName[0].toUpperCase()
                            : friend.username[0].toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(friend.status)} border-2 border-white rounded-full ${friend.status === "online" ? "animate-pulse" : ""}`}
                      ></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#073b4c] text-xl">
                        {friend.username}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {getStatusText(friend.status)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-8">
                    <button
                      className="bg-gray-200 text-[#ef476f] px-4 py-2 rounded-full font-bold hover:bg-gray-300 transition-all duration-300 flex items-center space-x-2"
                      onClick={() => handleRemove(friend._id)}
                    >
                      <X className="w-4 h-4" /> Remove
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
