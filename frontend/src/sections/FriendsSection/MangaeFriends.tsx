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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
        gsap.fromTo(".animate-item", 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
    }, containerRef);
    return () => ctx.revert();
  }, [])

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
    if (user && user.id) {
      (socket as any).emit("user_online", { userId: user.id });
    }
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
      case "online": return "bg-[#06d6a0]";
      case "in-game": return "bg-[#ffd166]";
      default: return "bg-gray-400";
    }
  };
  const getStatusText = (status?: string) => {
    switch (status) {
      case "online": return "Online";
      case "in-game": return "In Game";
      default: return "Offline";
    }
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto px-6 py-10 min-h-screen">
      {/* Background Orbs */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#D0BCFF] opacity-20 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-item">
         <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-[#21005D] hover:bg-[#EADDFF] transition-colors font-bold"
         >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Search & Friend Requests */}
          <div className="space-y-6 lg:col-span-1">
             {/* Search */}
             <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 border border-[#CAC4D0] shadow-sm animate-item">
                  <h2 className="text-xl font-bold text-[#1C1B1F] mb-4 flex items-center gap-2">
                      <UserPlus className="text-[#6750A4]" />
                      Add Friends
                  </h2>
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#49454F]" size={20}/>
                      <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full bg-[#F3EDF7] rounded-full pl-12 pr-4 py-3 text-[#1C1B1F] placeholder:text-[#49454F]/60 outline-none focus:ring-2 focus:ring-[#6750A4]"
                      />
                  </div>

                  {/* Search Results */}
                  {searchTerm && searchResults.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
                           {searchResults.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F3EDF7] hover:bg-[#EADDFF]/50 transition-colors">
                                     <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold">
                                              {user.avatar || user.username.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="overflow-hidden">
                                              <p className="text-sm font-bold text-[#1C1B1F] truncate">{user.username}</p>
                                          </div>
                                     </div>
                                     <button
                                        onClick={() => handleSendRequest(user._id)}
                                        disabled={user.sent}
                                        className={`p-2 rounded-full ${user.sent ? "bg-[#E8DEF8] text-[#49454F]" : "bg-[#6750A4] text-white hover:bg-[#523E8E]"}`}
                                     >
                                         {user.sent ? <Check size={16}/> : <AddUserIcon size={16}/>}
                                     </button>
                                </div>
                           ))}
                      </div>
                  )}
             </div>

             {/* Requests */}
             {(friendRequests.length > 0 || sentRequests.length > 0) && (
                 <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 border border-[#CAC4D0] shadow-sm animate-item">
                      {friendRequests.length > 0 && (
                          <div className="mb-6">
                               <h3 className="text-sm font-bold text-[#6750A4] uppercase tracking-wider mb-3">Received Requests</h3>
                               <div className="space-y-3">
                                   {friendRequests.map(user => (
                                       <div key={user._id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F3EDF7]">
                                           <div className="flex items-center gap-3">
                                               <div className="w-8 h-8 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold text-xs">
                                                  {user.username.charAt(0).toUpperCase()}
                                               </div>
                                               <span className="text-sm font-bold text-[#1C1B1F]">{user.username}</span>
                                           </div>
                                           <div className="flex gap-1">
                                                <button onClick={() => handleAccept(user._id)} className="p-1.5 bg-[#E6F4EA] text-[#0D652D] rounded-full hover:bg-[#C3EED0]"><Check size={14}/></button>
                                                <button onClick={() => handleReject(user._id)} className="p-1.5 bg-[#FFDAD6] text-[#B3261E] rounded-full hover:bg-[#FFB4AB]"><X size={14}/></button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                          </div>
                      )}

                      {sentRequests.length > 0 && (
                          <div>
                               <h3 className="text-sm font-bold text-[#6750A4] uppercase tracking-wider mb-3">Sent Requests</h3>
                               <div className="space-y-3">
                                   {sentRequests.map(user => (
                                       <div key={user._id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F3EDF7]/50 border border-[#E7E0EC]">
                                           <div className="flex items-center gap-3 opacity-70">
                                               <div className="w-8 h-8 rounded-full bg-[#E7E0EC] text-[#49454F] flex items-center justify-center font-bold text-xs">
                                                  {user.username.charAt(0).toUpperCase()}
                                               </div>
                                               <span className="text-sm font-medium text-[#1C1B1F]">{user.username}</span>
                                           </div>
                                            <button onClick={() => handleReject(user._id)} className="p-1.5 text-[#49454F] hover:bg-[#E7E0EC] rounded-full"><X size={14}/></button>
                                       </div>
                                   ))}
                               </div>
                          </div>
                      )}
                 </div>
             )}
          </div>

          {/* Right Column: Friends List */}
          <div className="lg:col-span-2">
               <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-[#CAC4D0] shadow-sm animate-item min-h-[600px]">
                    <div className="flex items-center justify-between mb-8">
                         <div>
                             <h2 className="text-2xl font-bold text-[#1C1B1F] flex items-center gap-2">
                                <Users size={28} className="text-[#6750A4]"/>
                                My Friends
                             </h2>
                             <p className="text-[#49454F]">{friends.length} Friends</p>
                         </div>
                         
                         <div className="bg-[#F3EDF7] p-1 rounded-full inline-flex">
                             {(['all', 'online', 'offline'] as const).map((tab) => (
                                 <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                                        activeTab === tab 
                                        ? "bg-white text-[#21005D] shadow-sm" 
                                        : "text-[#49454F] hover:text-[#1C1B1F]"
                                    }`}
                                 >
                                     {tab} {tab === 'online' && `(${onlineCount})`}
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading && <p className="col-span-2 text-center py-10 text-[#49454F]">Loading friends...</p>}
                        
                        {!loading && filteredFriends.length === 0 && (
                            <div className="col-span-2 text-center py-20 text-[#49454F]">
                                <div className="w-16 h-16 bg-[#F3EDF7] rounded-full flex items-center justify-center mx-auto mb-4">
                                     <Users size={32} className="opacity-50"/>
                                </div>
                                <p className="font-medium">No friends found.</p>
                            </div>
                        )}

                        {filteredFriends.map(friend => (
                            <div key={friend._id} className="group bg-white border border-[#E7E0EC] p-4 rounded-[24px] hover:shadow-md transition-shadow flex items-center gap-4 relative animate-item">
                                 <div className="relative">
                                     <div className="w-14 h-14 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#21005D] font-bold text-xl">
                                         {friend.avatar || friend.username.charAt(0).toUpperCase()}
                                     </div>
                                     <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(friend.status)}`} />
                                 </div>
                                 
                                 <div className="flex-1">
                                     <h3 className="font-bold text-[#1C1B1F] text-lg">{friend.username}</h3>
                                     <p className="text-xs text-[#49454F] font-medium uppercase tracking-wide">{getStatusText(friend.status)}</p>
                                 </div>

                                 <button 
                                    onClick={() => handleRemove(friend._id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-[#B3261E] hover:bg-[#FFDAD6] rounded-full transition-all"
                                    title="Remove Friend"
                                 >
                                     <X size={18} />
                                 </button>
                            </div>
                        ))}
                    </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export default ManageFriends;
