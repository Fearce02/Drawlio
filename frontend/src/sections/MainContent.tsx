import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Trophy,
  Clock,
  Star,
  Play,
  AlertCircle,
} from "lucide-react";
import socket from "../sockets/socket";

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
  // Add debugging to see when user props change
  useEffect(() => {
    console.log("[MainContent] User props updated:", user);
    console.log("[MainContent] XP data:", {
      xp: user.xp,
      currentXP: user.currentXP,
      xpToNextLevel: user.xpToNextLevel,
      level: user.level,
    });
  }, [user]);

  const winRate = Math.round((user.gamesWon / user.gamesPlayed) * 100);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = () => {
    const trimmedRoomCode = roomCode.trim().toUpperCase();

    // Clear previous error
    setError("");

    // Validate room code
    if (!trimmedRoomCode) {
      setError("Please enter a room code");
      return;
    }

    if (trimmedRoomCode.length < 4) {
      setError("Room code must be at least 4 characters");
      return;
    }

    // Start joining process
    setIsJoining(true);

    // Check if room exists
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
          // Room exists, navigate to it
          onJoinRoom(checkedRoomCode);
        } else {
          // Room doesn't exist
          setError("Room not found. Please check the room code and try again.");
        }
      }
    };

    socket.on("roomExists", handleRoomExists);

    return () => {
      socket.off("roomExists", handleRoomExists);
    };
  }, [roomCode, onJoinRoom]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Welcome Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-[#073b4c] mb-4">
          Welcome back,{" "}
          <span className="text-[#ef476f]">{user.name.split(" ")[0]}</span>!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Ready to unleash your creativity? Join a room or create your own and
          start drawing with friends!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                Level
              </p>
              <p className="text-4xl font-bold text-[#ef476f]">{user.level}</p>
            </div>
            <div className="w-16 h-16 bg-[#ef476f] rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
          {user.xp !== undefined &&
            user.currentXP !== undefined &&
            user.xpToNextLevel !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Total XP: {user.xp}</span>
                  <span>{user.xpToNextLevel} XP to next level</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Current XP: {user.currentXP} | Progress:{" "}
                  {Math.round(
                    (user.currentXP / (user.currentXP + user.xpToNextLevel)) *
                      100,
                  )}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#ef476f] h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (user.currentXP / (user.currentXP + user.xpToNextLevel)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                Games Played
              </p>
              <p className="text-4xl font-bold text-[#118ab2]">
                {user.gamesPlayed}
              </p>
            </div>
            <div className="w-16 h-16 bg-[#118ab2] rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                Games Won
              </p>
              <p className="text-4xl font-bold text-[#06d6a0]">
                {user.gamesWon}
              </p>
            </div>
            <div className="w-16 h-16 bg-[#06d6a0] rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                Win Rate
              </p>
              <p className="text-4xl font-bold text-[#ffd166]">{winRate}%</p>
            </div>
            <div className="w-16 h-16 bg-[#ffd166] rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Create Room Card */}
        <div className="bg-[#ef476f] rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-8">
              <Plus className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Create a Room</h3>
            <p className="text-pink-100 mb-8 text-lg leading-relaxed">
              Start your own drawing session! Set up a custom room with your
              preferred settings and invite friends to join the fun.
            </p>
            <button
              onClick={onCreateRoom}
              className="bg-white text-[#ef476f] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              Create Room
            </button>
          </div>
        </div>

        {/* Friends Card */}
        <div className="bg-[#06d6a0] rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-8">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Manage Friends</h3>
            <p className="text-emerald-100 mb-8 text-lg leading-relaxed">
              Connect with your friends, see who's online, and invite them to
              your drawing sessions for maximum fun!
            </p>
            <button
              onClick={onViewFriends}
              className="bg-white text-[#06d6a0] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              View Friends
            </button>
          </div>
        </div>
      </div>

      {/* Quick Join Section */}
      <div className="bg-white rounded-3xl p-10 shadow-lg">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-[#073b4c] mb-4">Quick Join</h3>
          <p className="text-gray-600 mb-8 text-lg">
            Have a room code? Join an existing game instantly!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`flex-1 px-6 py-4 border-2 rounded-full focus:outline-none text-lg transition-all duration-200 ${
                error
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-[#118ab2]"
              }`}
              disabled={isJoining}
            />
            <button
              onClick={handleJoinRoom}
              disabled={isJoining || !roomCode.trim()}
              className="bg-[#118ab2] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#0f7a9c] transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
