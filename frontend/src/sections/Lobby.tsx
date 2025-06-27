import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Settings, Users, Copy, Check, Crown } from "lucide-react";
import { gsap } from "gsap";
// import {
//   fadeInUp,
//   slideInFromLeft,
//   slideInFromRight,
//   staggerFadeIn,
// } from "../hooks/useGSAP";
import socket from "../sockets/socket";
import { useNavigate } from "react-router-dom";
import type { Player } from "../types/game";

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

interface LobbySettings {
  maxPlayers: number;
  roundDuration: number;
  isPrivate: boolean;
  password: string;
  totalRounds: number;
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
  const [players, setPlayers] = useState<Player[]>([]); //players in lobby
  const roomCode = useRef(
    localStorage.getItem("roomCode") ||
      Math.random().toString(36).substring(2, 8).toUpperCase(),
  ).current; // Random Room code for the lobby
  const [copied, setCopied] = useState(false); //for copying the roomcode
  const [host, setHost] = useState<string | null>(null); //Assigning the lobby host

  const headerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const guestUsername = localStorage.getItem("guestUsername") || "Guest";
  const isHost = guestUsername == host;

  // useEffect(() => {
  //   // Page entrance animations
  //   if (headerRef.current) {
  //     slideInFromLeft(headerRef.current, 0.1);
  //   }

  //   if (settingsRef.current) {
  //     fadeInUp(settingsRef.current, 0.3);
  //   }

  //   if (friendsRef.current) {
  //     slideInFromRight(friendsRef.current, 0.5);
  //   }

  //   if (createButtonRef.current) {
  //     gsap.fromTo(
  //       createButtonRef.current,
  //       { opacity: 0, y: 50, scale: 0.8 },
  //       {
  //         opacity: 1,
  //         y: 0,
  //         scale: 1,
  //         duration: 0.8,
  //         delay: 0.7,
  //         ease: "back.out(1.7)",
  //       },
  //     );
  //   }

  //   // Animate form elements
  //   staggerFadeIn(".form-group", 0.8);
  // }, []);

  useEffect(() => {
    const username = localStorage.getItem("guestUsername") || "Guest";

    socket.emit("join_lobby", { roomCode, username });

    socket.on("PlayerJoined", (users) => {
      const parsedPlayers = users.map((p: any) => ({
        id: p.socketId || p.id,
        name: p.username || p.name,
        score: p.score ?? 0,
        isConnected: p.isConnected ?? true,
        isDrawing: p.isDrawing ?? false,
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
          ...settings,
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

    // Copy animation
    const copyButton = event?.currentTarget;
    if (copyButton) {
      gsap.to(copyButton, {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }

    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateGameRoom = () => {
    console.log("Creating room with settings:", roomSettings);

    socket.emit("startGame", { roomCode });

    // Success animation
    if (createButtonRef.current) {
      gsap.to(createButtonRef.current, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  };

  const handleSettingsChange = (
    field: keyof typeof roomSettings,
    value: any,
  ) => {
    const updated = { ...roomSettings, [field]: value };
    setRoomSettings(updated);

    if (isHost) {
      socket.emit("updateSettings", { roomCode, settings: updated });
    }
  };

  const handleStartGame = () => {
    socket.emit("startGame", { roomCode });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div ref={headerRef} className="flex items-center mb-8">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Room Settings */}
        <div className="lg:col-span-2 space-y-8">
          <div ref={settingsRef} className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-[#118ab2] rounded-full flex items-center justify-center">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#073b4c]">
                Room Settings
              </h2>
            </div>

            <div className="space-y-8">
              {/* Room Name */}
              <div className="form-group">
                <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomSettings.name}
                  disabled={!isHost}
                  onChange={(e) =>
                    setRoomSettings({ ...roomSettings, name: e.target.value })
                  }
                  placeholder="Drawlio-Room-1"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
                  onFocus={(e) => {
                    gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
                  }}
                  onBlur={(e) => {
                    gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                  }}
                />
              </div>

              {/* Room Code */}
              <div className="form-group">
                <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                  Room Code
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    disabled={!isHost}
                    type="text"
                    value={roomCode}
                    readOnly
                    className="flex-1 px-6 py-4 bg-gray-100 border-2 border-gray-200 rounded-full font-mono text-xl font-bold text-[#ef476f]"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="px-6 py-4 bg-[#ffd166] text-[#073b4c] rounded-full hover:bg-[#ffcc4d] transition-all duration-300 flex items-center space-x-2 font-bold transform hover:scale-105"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                    Max Players
                  </label>
                  <select
                    disabled={!isHost}
                    value={roomSettings.maxPlayers}
                    onChange={(e) =>
                      setRoomSettings({
                        ...roomSettings,
                        maxPlayers: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
                  >
                    {[4, 6, 8, 10, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} players
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                    Rounds
                  </label>
                  <select
                    disabled={!isHost}
                    value={roomSettings.rounds}
                    onChange={(e) =>
                      setRoomSettings({
                        ...roomSettings,
                        rounds: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} round{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                    Draw Time
                  </label>
                  <select
                    disabled={!isHost}
                    value={roomSettings.drawTime}
                    onChange={(e) =>
                      setRoomSettings({
                        ...roomSettings,
                        drawTime: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
                  >
                    {[30, 60, 80, 100, 120].map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {seconds} seconds
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*Guest Lobby list */}
        <div ref={friendsRef} className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-[#06d6a0] rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#073b4c]">
              Player's in Lobby
            </h2>
          </div>

          <div className="space-y-4">
            {players.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-lg">
                Waiting for other players to join...
              </p>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-100"
                >
                  <div className="w-12 h-12 bg-[#06d6a0] rounded-full flex items-center justify-center text-white font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#073b4c]">
                      {player.name}{" "}
                      {player.name === host && (
                        <span className="text-yellow-400">
                          {" "}
                          <Crown className="w-3 h-3" />
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[#06d6a0]">Online</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="mt-12 flex justify-center">
        <button
          ref={createButtonRef}
          onClick={handleStartGame}
          disabled={!roomSettings.name.trim()}
          className="bg-[#ef476f] text-white px-16 py-5 rounded-full font-bold text-xl hover:bg-[#e63946] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              gsap.to(e.currentTarget, { y: -3, duration: 0.3 });
            }
          }}
          onMouseLeave={(e) => {
            gsap.to(e.currentTarget, { y: 0, duration: 0.3 });
          }}
        >
          Start Playing
        </button>
      </div>
    </div>
  );
};

export default Lobby;
