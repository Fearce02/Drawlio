import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Users,
  Trophy,
  Clock,
  Star as StarIcon,
  Play,
  AlertCircle,
  ArrowRight,
  Search
} from "lucide-react";
import socket from "../sockets/socket";
import { gsap } from "gsap";

interface MainContentProps {
  user: {
    name: string;
    level: number;
    gamesPlayed: number;
    gamesWon: number;
    xp?: number;
    currentXP?: number;
    xpToNextLevel?: number;
  };
  onCreateRoom: () => void;
  onViewFriends: () => void;
  onJoinRoom: (roomCode: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  user,
  onCreateRoom,
  onViewFriends,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const winRate = user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;

  useEffect(() => {
    // Entrance Animations
    const ctx = gsap.context(() => {
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

        gsap.fromTo(".animate-item", 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
        );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleJoinRoom = () => {
    const trimmedRoomCode = roomCode.trim().toUpperCase();
    setError("");

    if (!trimmedRoomCode) {
      setError("Please enter a room code");
      return;
    }
    if (trimmedRoomCode.length < 4) {
      setError("Room code must be at least 4 characters");
      return;
    }

    setIsJoining(true);
    socket.emit("checkRoomExists", { roomCode: trimmedRoomCode });
  };

  useEffect(() => {
    const handleRoomExists = ({
      roomCode: checkedRoomCode,
      exists,
    }: {
      roomCode: string;
      exists: boolean;
    }) => {
      if (checkedRoomCode === roomCode.trim().toUpperCase()) {
        setIsJoining(false);
        if (exists) {
          onJoinRoom(checkedRoomCode);
        } else {
          setError("Room not found. Please check code.");
        }
      }
    };

    socket.on("roomExists", handleRoomExists);
    return () => {
      socket.off("roomExists", handleRoomExists);
    };
  }, [roomCode, onJoinRoom]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleJoinRoom();
  };

  return (
    <div ref={containerRef} className="min-h-screen relative w-full overflow-hidden">
        {/* Background Orbs */}
       <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="bg-orb absolute top-0 left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#D0BCFF] opacity-20 blur-[100px]" />
            <div className="bg-orb absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EFB8C8] opacity-20 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20 pt-10">
        {/* Welcome Section */}
        <div className="mb-12 animate-item">
            <h1 className="text-display-large font-bold text-5xl md:text-6xl text-[#1C1B1F] mb-4 tracking-tight">
                Hello, <span className="text-[#6750A4]">{user.name.split(" ")[0]}</span>
            </h1>
            <p className="text-xl text-[#49454F]">Ready to draw some chaos today?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
             <StatCard 
                label="Level" 
                value={user.level} 
                icon={<StarIcon size={24} className="text-[#6750A4]"/>}
                color="bg-[#EADDFF]"
                subcontent={
                    user.xp !== undefined && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-[#49454F] mb-1 font-medium">
                                <span>{user.currentXP} XP</span>
                                <span>{user.xpToNextLevel} to next</span>
                            </div>
                            <div className="w-full bg-[#E7E0EC] rounded-full h-2 overflow-hidden">
                                <div className="bg-[#6750A4] h-full rounded-full transition-all duration-500"
                                     style={{ width: `${Math.min(100, (user.currentXP! / (user.currentXP! + user.xpToNextLevel!)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )
                }
             />
             <StatCard 
                label="Games Played" 
                value={user.gamesPlayed} 
                icon={<Play size={24} className="text-[#21005D]"/>}
                color="bg-[#E8DEF8]"
             />
             <StatCard 
                label="Games Won" 
                value={user.gamesWon} 
                icon={<Trophy size={24} className="text-[#9A25AE]"/>}
                color="bg-[#FFD8E4]"
             />
             <StatCard 
                label="Win Rate" 
                value={`${winRate}%`} 
                icon={<Clock size={24} className="text-[#7D5260]"/>}
                color="bg-[#FFD7F4]"
             />
        </div>

        {/* Action Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Create Room */}
            <div className="group bg-[#6750A4] rounded-[32px] p-10 text-white relative overflow-hidden animate-item shadow-xl shadow-[#6750A4]/20 transition-transform hover:scale-[1.01]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:opacity-10 transition-opacity"></div>
                
                <div className="relative z-10 flex flex-col items-start h-full">
                    <div className="w-16 h-16 bg-[#EADDFF]/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                        <Plus size={32} className="text-[#EADDFF]" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3">Create Room</h3>
                    <p className="text-[#EADDFF] text-lg mb-8 max-w-sm">
                        Host a private game with custom rules for your friends.
                    </p>
                    <button 
                        onClick={onCreateRoom}
                        className="mt-auto bg-[#EADDFF] text-[#21005D] px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-white transition-colors"
                    >
                        <span>Start Hosting</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* Friends */}
            <div className="group bg-[#7D5260] rounded-[32px] p-10 text-white relative overflow-hidden animate-item shadow-xl shadow-[#7D5260]/20 transition-transform hover:scale-[1.01]">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:opacity-10 transition-opacity"></div>

                 <div className="relative z-10 flex flex-col items-start h-full">
                    <div className="w-16 h-16 bg-[#FFD8E4]/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                        <Users size={32} className="text-[#FFD8E4]" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3">Friends</h3>
                    <p className="text-[#FFD8E4] text-lg mb-8 max-w-sm">
                        Check who is online and invite them to play.
                    </p>
                    <button 
                        onClick={onViewFriends}
                        className="mt-auto bg-[#FFD8E4] text-[#31111D] px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-white transition-colors"
                    >
                        <span>View Friends</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* Quick Join */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-10 shadow-sm border border-[#E7E0EC] animate-item">
            <div className="max-w-xl mx-auto text-center">
                 <h3 className="text-2xl font-bold text-[#1C1B1F] mb-2">Have a code?</h3>
                 <p className="text-[#49454F] mb-8">Join your friend's game instantly.</p>
                 
                 <div className="flex flex-col sm:flex-row gap-4">
                     <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#49454F]" size={20}/>
                        <input
                            type="text"
                            placeholder="Enter Room Code"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isJoining}
                            className={`w-full bg-[#F3EDF7] rounded-full pl-12 pr-6 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#6750A4] transition-all uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal
                                ${error ? "ring-2 ring-[#B3261E] bg-[#FFF9F9]" : ""}
                            `}
                        />
                     </div>
                     <button
                        onClick={handleJoinRoom}
                        disabled={isJoining || !roomCode.trim()}
                        className="bg-[#6750A4] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#523E8E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                     >
                        {isJoining ? "Joining..." : "Join"}
                     </button>
                 </div>
                 {error && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[#B3261E]">
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                 )}
            </div>
        </div>

      </div>
    </div>
  );
};

// Helper Stat Card
const StatCard = ({ label, value, icon, color, subcontent }: any) => (
    <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 border border-[#E7E0EC] shadow-sm animate-item hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[#49454F] font-bold text-sm tracking-wider uppercase">{label}</span>
            <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
                {icon}
            </div>
        </div>
        <div className="text-4xl font-bold text-[#1C1B1F]">{value}</div>
        {subcontent}
    </div>
);

export default MainContent;
