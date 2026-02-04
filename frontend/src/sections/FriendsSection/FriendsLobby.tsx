import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Settings,
  Users,
  Copy,
  Check,
  UserPlus,
  X,
  Crown,
  Mail,
  Play
} from "lucide-react";
import { gsap } from "gsap";
import socket from "../../sockets/socket";
import { useNavigate, useLocation } from "react-router-dom";
import type { Player } from "../../types/game";
import FriendsChat from "./FriendsChat";
import { getFriendsList } from "../../utils/friendsApi";

// Reuse SelectField from Lobby.tsx or define similar
interface SelectFieldProps {
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: any) => void;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, options, onChange, disabled }) => (
  <div className="group">
    <label className="block text-xs font-bold text-[#6750A4] mb-1 pl-1 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full appearance-none bg-[#F3EDF7] border-0 rounded-full px-6 py-4 pr-10
          font-medium text-[#1C1B1F] outline-none 
          transition-all duration-200
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-[#EADDFF] focus:ring-2 focus:ring-[#6750A4]"}
        `}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#49454F]">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
);


interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
  avatar?: string;
}

interface FriendsLobbyProps {
  onBack: () => void;
}

const FriendsLobby: React.FC<FriendsLobbyProps> = ({ onBack }) => {
  const [roomSettings, setRoomSettings] = useState({
    name: "",
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    isPrivate: false,
    password: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState<Player[]>([]); 
  const [friends, setFriends] = useState<Friend[]>([]); 
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]); 

  const urlParams = new URLSearchParams(location.search);
  const urlRoomCode = urlParams.get("roomCode");
  const roomCode = useRef(
    urlRoomCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
  ).current; 
  const [copied, setCopied] = useState(false); 
  const [host, setHost] = useState<string | null>(null); 
  const [showInviteModal, setShowInviteModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  const playersRef = useRef<Player[]>([]);
  const roomSettingsRef = useRef(roomSettings);
  const hostRef = useRef<string | null>(null);

  const userRaw = localStorage.getItem("user");
  const [username, setUsername] = useState<string>("");

  const isHost = username === host;

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    roomSettingsRef.current = roomSettings;
  }, [roomSettings]);

  useEffect(() => {
    hostRef.current = host;
  }, [host]);

  useEffect(() => {
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setUsername(
          user.username || user.email || `${user.firstName} ${user.lastName}`,
        );
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [userRaw]);

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
            avatar: friend.avatar || friend.firstName?.[0]?.toUpperCase(),
          }),
        );
        setFriends(realFriends);
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      }
    };

    fetchFriends();

    const handleFriendStatusUpdate = ({
      userId,
      status,
    }: {
      userId: string;
      status: string;
    }) => {
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
    };

    (socket as any).on("friend_status_update", handleFriendStatusUpdate);

    return () => {
      (socket as any).off("friend_status_update", handleFriendStatusUpdate);
    };
  }, []);

  useEffect(() => {
    if (!username) return;

    socket.emit("join_lobby", { roomCode, username });

    const handlePlayerJoined = (users: any[]) => {
      const parsedPlayers = users.map((p: any) => ({
        id: p.socketId || p.id,
        name: p.username || p.name,
        score: p.score ?? 0,
        isConnected: p.isConnected ?? true,
        isDrawing: p.isDrawing ?? false,
      }));
      setPlayers(parsedPlayers);
    };

    const handleHostAssigned = ({ host }: { host: string }) => {
      setHost(host);
    };

    const handleLobbySettingsUpdated = (settings: any) => {
      if (settings && typeof settings === "object") {
        setRoomSettings((prev) => ({
          ...prev,
          maxPlayers: settings.maxPlayers ?? prev.maxPlayers,
          rounds: settings.totalRounds ?? prev.rounds,
          drawTime: settings.roundDuration ?? prev.drawTime,
          isPrivate: settings.isPrivate ?? prev.isPrivate,
          password: settings.password ?? prev.password,
        }));
      }
    };

    const handleGameStarted = () => {
      navigate("/game", {
        state: {
          players: playersRef.current,
          settings: roomSettingsRef.current,
          host: hostRef.current,
          roomCode: roomCode,
        },
      });
    };

    socket.on("PlayerJoined", handlePlayerJoined);
    socket.on("HostAssigned", handleHostAssigned);
    socket.on("lobbySettingsUpdated", handleLobbySettingsUpdated);
    socket.on("GameStarted", handleGameStarted);

    return () => {
      socket.off("PlayerJoined", handlePlayerJoined);
      socket.off("HostAssigned", handleHostAssigned);
      socket.off("lobbySettingsUpdated", handleLobbySettingsUpdated);
      socket.off("GameStarted", handleGameStarted);
    };
  }, [roomCode, navigate, username]);

  useEffect(() => {
      const ctx = gsap.context(() => {
            gsap.fromTo(".animate-card", 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
            );

            gsap.to(".bg-orb", {
                y: -20,
                x: 10,
                rotation: 360,
                duration: 20,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: 2,
            });
      }, containerRef);
      return () => ctx.revert();
  }, [])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    socket.emit("startGame", { roomCode });
  };

  const handleBackToDashboard = () => {
    if (username && roomCode) {
      socket.emit("leave_lobby", { roomCode, username });
    }
    onBack();
  };

  const handleSettingsChange = (
    field: keyof typeof roomSettings,
    value: any,
  ) => {
    if (field === "name" && typeof value !== "string") return;
    const updated = { ...roomSettings, [field]: value };
    setRoomSettings(updated);

    if (isHost) {
      const backendSettings = {
        maxPlayers: updated.maxPlayers,
        totalRounds: updated.rounds,
        roundDuration: updated.drawTime,
        isPrivate: updated.isPrivate,
        password: updated.password,
      };
      socket.emit("updateSettings", { roomCode, settings: backendSettings });
    }
  };

  const handleInviteFriend = (friendId: string, friendUsername: string) => {
    setInvitedFriends((prev) => [...prev, friendId]);
    socket.emit("inviteFriend", {
      friendId,
      friendUsername,
      roomCode,
      roomName: roomSettings.name || `Room ${roomCode}`,
      inviterUsername: username,
    });
    setShowInviteModal(false);
  };

  const handleRemoveInvitedFriend = (friendId: string) => {
    setInvitedFriends((prev) => prev.filter((id) => id !== friendId));
  };

  const getInvitedFriends = () => {
    return friends.filter((friend) => invitedFriends.includes(friend.id));
  };

  const getAvailableFriends = () => {
    return friends.filter((friend) => !invitedFriends.includes(friend.id));
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDF8FC] relative overflow-hidden py-8 px-4 font-sans text-[#1C1B1F]">
      {/* Background Orbs */}
       <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="bg-orb absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#D0BCFF] opacity-20 blur-[100px]" />
            <div className="bg-orb absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EFB8C8] opacity-20 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center mb-8 animate-card">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EADDFF] text-[#21005D] hover:bg-[#D0BCFF] transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-[#CAC4D0] shadow-sm animate-card">
                <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#21005D]">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#1C1B1F]">Room Settings</h2>
                             <p className="text-[#49454F] text-sm">Configure your private game</p>
                        </div>
                     </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 {/* Room Name */}
                 <div className="group md:col-span-2">
                    <label className="block text-xs font-bold text-[#6750A4] mb-1 pl-1 uppercase tracking-wider">Room Name</label>
                    <input
                        type="text"
                        value={roomSettings.name}
                        disabled={!isHost}
                        onChange={(e) => handleSettingsChange("name", e.target.value)}
                        placeholder="e.g. Friday Night Chaos"
                        className="w-full bg-[#F3EDF7] border-0 rounded-full px-6 py-4 font-medium text-[#1C1B1F] placeholder:text-[#49454F]/50 outline-none focus:ring-2 focus:ring-[#6750A4] transition-all"
                    />
                 </div>

                 {/* Room Code */}
                 <div className="group md:col-span-2">
                     <label className="block text-xs font-bold text-[#6750A4] mb-1 pl-1 uppercase tracking-wider">Room Code</label>
                     <div className="relative">
                        <input
                            disabled={!isHost}
                            type="text"
                            value={roomCode}
                            readOnly
                            className="w-full bg-[#F3EDF7] border-0 rounded-full px-6 py-4 font-mono font-bold text-[#1C1B1F] outline-none"
                        />
                        <button
                            onClick={handleCopyCode}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#EADDFF] hover:bg-[#D0BCFF] text-[#21005D] px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
                        >
                            {copied ? <Check size={16}/> : <Copy size={16}/>}
                            <span>{copied ? "Copied" : "Copy"}</span>
                        </button>
                     </div>
                 </div>

                 <SelectField 
                    label="Max Players" 
                    value={roomSettings.maxPlayers}
                    disabled={!isHost}
                    options={[2,4,6,8,10,12].map(n => ({ value: n, label: `${n} Players` }))}
                    onChange={(v) => handleSettingsChange("maxPlayers", parseInt(v))}
                 />

                <SelectField 
                    label="Rounds" 
                    value={roomSettings.rounds}
                    disabled={!isHost}
                    options={[1,2,3,4,5].map(n => ({ value: n, label: `${n} Round${n>1?'s':''}` }))}
                    onChange={(v) => handleSettingsChange("rounds", parseInt(v))}
                 />

                 <SelectField 
                    label="Draw Time" 
                    value={roomSettings.drawTime}
                    disabled={!isHost}
                    options={[30,60,80,100,120].map(n => ({ value: n, label: `${n} Seconds` }))}
                    onChange={(v) => handleSettingsChange("drawTime", parseInt(v))}
                 />

                 <div className="flex items-end pb-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${roomSettings.isPrivate ? "bg-[#6750A4] border-[#6750A4]" : "border-[#49454F]"}`}>
                            {roomSettings.isPrivate && <Check size={14} className="text-white" />}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={roomSettings.isPrivate}
                            disabled={!isHost}
                            onChange={(e) => handleSettingsChange("isPrivate", e.target.checked)}
                        />
                        <span className="text-[#1C1B1F] font-medium">Private Room</span>
                    </label>
                 </div>

                 {roomSettings.isPrivate && (
                    <div className="group md:col-span-2">
                        <label className="block text-xs font-bold text-[#6750A4] mb-1 pl-1 uppercase tracking-wider">Password</label>
                        <input
                            type="text"
                            value={roomSettings.password}
                            disabled={!isHost}
                            onChange={(e) => handleSettingsChange("password", e.target.value)}
                            placeholder="Set a password"
                            className="w-full bg-[#F3EDF7] border-0 rounded-full px-6 py-4 font-medium text-[#1C1B1F] outline-none focus:ring-2 focus:ring-[#6750A4] transition-all"
                        />
                    </div>
                 )}
              </div>
            </div>

            {/* Invited Friends List */}
            <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-[#CAC4D0] shadow-sm animate-card">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#E8DEF8] flex items-center justify-center text-[#1D192B]">
                            <Mail size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1C1B1F]">Invitations</h2>
                     </div>
                     <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-[#6750A4] text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-[#523E8E] transition-colors flex items-center gap-2"
                     >
                        <UserPlus size={18} />
                        <span>Invite Friends</span>
                     </button>
                 </div>

                 {getInvitedFriends().length === 0 ? (
                    <div className="text-center py-8 text-[#49454F]">
                        <p>No invitations sent yet.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {getInvitedFriends().map(friend => (
                            <div key={friend.id} className="bg-[#F3EDF7] p-3 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold text-sm">
                                        {friend.avatar || friend.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1C1B1F] text-sm">{friend.username}</p>
                                        <p className="text-xs text-[#49454F]">{friend.isOnline ? "Online" : "Offline"}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveInvitedFriend(friend.id)} className="text-[#B3261E] p-2 hover:bg-[#B3261E]/10 rounded-full">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
          </div>

          <div className="space-y-6">
             {/* Players List */}
             <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-[#CAC4D0] shadow-sm animate-card flex flex-col h-full min-h-[500px]">
                 <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#FFD8E4] flex items-center justify-center text-[#31111D]">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1C1B1F]">Lobby</h2>
                            <p className="text-[#49454F] text-sm">{players.length} / {roomSettings.maxPlayers} Players</p>
                        </div>
                 </div>

                 <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                     {players.length === 0 ? (
                        <p className="text-center text-[#49454F] mt-10">Waiting for players...</p>
                     ) : (
                        players.map(player => (
                            <div key={player.id} className="flex items-center gap-4 p-3 rounded-2xl bg-[#F3EDF7]">
                                <div className="w-10 h-10 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold relative">
                                    {player.name.charAt(0).toUpperCase()}
                                    {player.name === host && (
                                        <div className="absolute -top-1 -right-1 bg-[#FFD8E4] text-[#31111D] p-1 rounded-full shadow-sm">
                                            <Crown size={12} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-[#1C1B1F] text-sm">{player.name}</p>
                                    <p className="text-xs text-[#49454F]">Ready</p>
                                </div>
                            </div>
                        ))
                     )}
                 </div>
             </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center mt-12 mb-20 animate-card">
            <button
                ref={createButtonRef}
                onClick={handleStartGame}
                 disabled={typeof roomSettings.name !== "string" || !roomSettings.name.trim()}
                 className={`
                    group relative px-12 py-5 rounded-full text-xl font-bold flex items-center gap-3 shadow-lg transition-all duration-300
                    ${(typeof roomSettings.name !== "string" || !roomSettings.name.trim()) 
                        ? 'bg-[#E7E0EC] text-[#1C1B1F]/50 cursor-not-allowed' 
                        : 'bg-[#6750A4] text-white hover:bg-[#523E8E] hover:scale-105 hover:shadow-[#6750A4]/30'
                    }
                 `}
            >
                <span>Start Game</span>
                <Play className="fill-current w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* FriendsChat for lobby chat */}
        <FriendsChat roomCode={roomCode} username={username} />

        {/* Invite Friends Modal */}
        {showInviteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <div className="bg-[#FDF8FC] rounded-[28px] p-6 w-full max-w-md shadow-2xl animate-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-[#1C1B1F]">Invite Friends</h3>
                        <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-[#E7E0EC] rounded-full text-[#49454F]">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {getAvailableFriends().length === 0 ? (
                            <p className="text-center text-[#49454F] py-8">No friends available.</p>
                        ) : (
                            getAvailableFriends().map(friend => (
                                <div key={friend.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F3EDF7] transition-colors">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#EADDFF] text-[#21005D] flex items-center justify-center font-bold">
                                            {friend.avatar || friend.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1C1B1F] text-sm">{friend.username}</p>
                                            <p className="text-xs text-[#49454F]">{friend.isOnline ? "Online" : "Offline"}</p>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={() => handleInviteFriend(friend.id, friend.username)}
                                        className="bg-[#6750A4] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#523E8E] transition-colors"
                                     >
                                        Invite
                                     </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default FriendsLobby;
