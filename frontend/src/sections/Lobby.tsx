import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Settings, Users, Copy, Check, Crown, Play } from "lucide-react";
import { gsap } from "gsap";
import socket from "../sockets/socket";
import { useNavigate } from "react-router-dom";
import type { Player } from "../types/game";
import LobbyChat from "./LobbyChat";

interface Friend {
  id: number;
  name: string;
  status: "online" | "offline" | "in-game";
  avatar: string;
}

interface CreateRoomProps {
  friends: Friend[];
  onBack: () => void;
}

const Lobby: React.FC<CreateRoomProps> = ({ friends, onBack }) => {
  const [roomSettings, setRoomSettings] = useState({
    name: "",
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    isPrivate: false,
    password: "",
  });
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const roomCode = useRef(
    localStorage.getItem("roomCode") ||
      Math.random().toString(36).substring(2, 8).toUpperCase(),
  ).current;
  const [copied, setCopied] = useState(false);
  const [host, setHost] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const guestUsername = localStorage.getItem("guestUsername") || "Guest";
  const isHost = guestUsername == host;

  useEffect(() => {
    // Entrance Animations
    const ctx = gsap.context(() => {
        // Orb Animation
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

        gsap.fromTo(".animate-card", 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", delay: 0.2 }
        );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Join lobby with avatar info
    const username = localStorage.getItem("guestUsername") || "Guest";
    let avatar = "";
    
    // Try to get avatar from authenticated user
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
        try {
            const user = JSON.parse(userRaw);
            avatar = user.avatar;
        } catch (e) {
            console.error("Error parsing user from localstorage", e);
        }
    }

    socket.emit("join_lobby", { roomCode, username, avatar });

    socket.on("PlayerJoined", (users) => {
      const parsedPlayers = users.map((p: any) => ({
        id: p.socketId || p.id,
        name: p.username || p.name,
        score: p.score ?? 0,
        isConnected: p.isConnected ?? true,
        isDrawing: p.isDrawing ?? false,
        avatar: p.avatar,
      }));
      setPlayers(parsedPlayers);
    });

    socket.on("HostAssigned", ({ host }) => {
      setHost(host);
    });

    socket.on("lobbySettingsUpdated", (settings) => {
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
    });

    socket.on("GameStarted", ({ message }) => {
      navigate("/game", {
        state: {
          players,
          settings: roomSettings,
          host,
        },
      });
    });

    return () => {
      socket.off("PlayerJoined");
      socket.off("HostAssigned");
      socket.off("lobbySettingsUpdated");
      socket.off("GameStarted");
    };
  }, [roomCode, navigate, players, host, roomSettings]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleStartGame = () => {
    socket.emit("startGame", { roomCode });
  };
  
  // Get current user avatar for passing to chat
  const getCurrentUserAvatar = () => {
      try {
          const userRaw = localStorage.getItem("user");
          if (userRaw) {
              const user = JSON.parse(userRaw);
              return user.avatar;
          }
      } catch (e) {
          return undefined;
      }
      return undefined;
  };
  const currentUserAvatar = getCurrentUserAvatar();

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
                onClick={onBack} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EADDFF] text-[#21005D] hover:bg-[#D0BCFF] transition-colors font-medium">
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-[#CAC4D0] shadow-sm animate-card">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#21005D]">
                            <Settings size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#1C1B1F]">Lobby Settings</h2>
                    </div>

                    <div className="space-y-6">
                         {/* Room Name */}
                         <div>
                            <label className="block text-sm font-medium text-[#49454F] mb-2 px-2">Room Name</label>
                            <input 
                                type="text" 
                                value={roomSettings.name}
                                disabled={!isHost}
                                onChange={(e) => handleSettingsChange("name", e.target.value)}
                                placeholder="Epic Drawing Room..."
                                className="w-full bg-[#F3EDF7] border border-transparent focus:border-[#6750A4] rounded-2xl px-6 py-4 text-[#1C1B1F] outline-none transition-all placeholder-[#49454F]/50"
                            />
                         </div>
                        
                         {/* Room Code */}
                         <div>
                            <label className="block text-sm font-medium text-[#49454F] mb-2 px-2">Invite Code</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-[#F3EDF7] rounded-2xl px-6 py-4 font-mono text-lg tracking-widest text-[#6750A4] font-bold border border-transparent">
                                    {roomCode}
                                </div>
                                <button 
                                    onClick={handleCopyCode}
                                    className="bg-[#6750A4] text-white px-6 rounded-2xl flex items-center justify-center hover:bg-[#523E8E] transition-colors shadow-sm"
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                         </div>

                         {/* Grid Settings */}
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <SelectField 
                                label="Max Players"
                                value={roomSettings.maxPlayers}
                                options={[2,4,6,8,10,12]}
                                onChange={(val) => handleSettingsChange("maxPlayers", val)}
                                disabled={!isHost}
                                suffix=""
                            />
                             <SelectField 
                                label="Rounds"
                                value={roomSettings.rounds}
                                options={[1,2,3,4,5]}
                                onChange={(val) => handleSettingsChange("rounds", val)}
                                disabled={!isHost}
                                suffix=""
                            />
                             <SelectField 
                                label="Draw Time"
                                value={roomSettings.drawTime}
                                options={[30,60,80,100,120]}
                                onChange={(val) => handleSettingsChange("drawTime", val)}
                                disabled={!isHost}
                                suffix="s"
                            />
                         </div>
                    </div>
                </div>
            </div>

            {/* Players Column */}
            <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 border border-[#CAC4D0] shadow-sm animate-card h-full flex flex-col">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#E8DEF8] flex items-center justify-center text-[#1D192B]">
                            <Users size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#1C1B1F]">Players <span className="text-[#6750A4] text-lg bg-[#EADDFF] px-3 py-1 rounded-full ml-2">{players.length}</span></h2>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px]">
                        {players.length === 0 ? (
                            <div className="text-center text-[#49454F] py-8 border-2 border-dashed border-[#CAC4D0] rounded-2xl">
                                Waiting for players...
                            </div>
                        ) : (
                            players.map(player => (
                                <div key={player.id} className="flex items-center gap-3 p-3 bg-[#F3EDF7] rounded-2xl group hover:shadow-sm transition-shadow">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6750A4] to-[#523E8E] text-white flex items-center justify-center font-bold text-lg overflow-hidden">
                                        {player.avatar ? (
                                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                                        ) : (
                                            player.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                         <div className="flex items-center gap-2">
                                            <span className="font-semibold text-[#1C1B1F]">{player.name}</span>
                                            {player.name === host && <Crown size={14} className="text-[#FFB703] fill-[#FFB703]"/>}
                                         </div>
                                         <span className="text-xs text-[#49454F] bg-white px-2 py-0.5 rounded-full inline-block mt-1">
                                            {player.score} XP
                                         </span>
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

        {/* Chat */}
        <LobbyChat roomCode={roomCode} username={guestUsername} avatar={currentUserAvatar} />

      </div>
    </div>
  );
};

// Helper Component for Select
const SelectField = ({ label, value, options, onChange, disabled, suffix }: any) => (
    <div>
        <label className="block text-sm font-medium text-[#49454F] mb-2 px-2">{label}</label>
        <div className="relative">
            <select
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full bg-[#F3EDF7] appearance-none rounded-2xl px-6 py-4 text-[#1C1B1F] outline-none focus:ring-2 focus:ring-[#6750A4] border-r-[16px] border-transparent cursor-pointer font-medium disabled:opacity-70"
            >
                {options.map((opt: any) => (
                    <option key={opt} value={opt}>{opt}{suffix}</option>
                ))}
            </select>
        </div>
    </div>
);

export default Lobby;
