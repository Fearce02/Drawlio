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
} from "lucide-react";
import { gsap } from "gsap";
// GSAP animations removed for now
import socket from "../../sockets/socket";
import { useNavigate, useLocation } from "react-router-dom";
import type { Player } from "../../types/game";
import FriendsChat from "./FriendsChat";
import { getFriendsList } from "../../utils/friendsApi";

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

// LobbySettings interface removed as it's not used

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
  const [players, setPlayers] = useState<Player[]>([]); // players in lobby
  const [friends, setFriends] = useState<Friend[]>([]); // user's friends list
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]); // friends invited to this room

  // Get room code from URL params or generate new one
  const urlParams = new URLSearchParams(location.search);
  const urlRoomCode = urlParams.get("roomCode");
  const roomCode = useRef(
    urlRoomCode ||
      localStorage.getItem("roomCode") ||
      Math.random().toString(36).substring(2, 8).toUpperCase(),
  ).current; // Random Room code for the lobby
  const [copied, setCopied] = useState(false); // for copying the roomcode
  const [host, setHost] = useState<string | null>(null); // Assigning the lobby host
  const [showInviteModal, setShowInviteModal] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Refs to access current state in event handlers
  const playersRef = useRef<Player[]>([]);
  const roomSettingsRef = useRef(roomSettings);
  const hostRef = useRef<string | null>(null);

  // Get current user info
  const userRaw = localStorage.getItem("user");
  const [username, setUsername] = useState<string>("");

  const isHost = username === host;

  // Update refs when state changes
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
    // Get current user info
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
    // Fetch friends list
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

      // Leave the lobby when component unmounts
      if (username && roomCode) {
        socket.emit("leave_lobby", { roomCode, username });
      }
    };
  }, [roomCode, navigate, username]); // Removed problematic dependencies

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

  const handleStartGame = () => {
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
    if (field === "name" && typeof value !== "string") return;
    const updated = { ...roomSettings, [field]: value };
    setRoomSettings(updated);

    if (isHost) {
      // Map frontend settings to backend format
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
    // Add to invited friends list
    setInvitedFriends((prev) => [...prev, friendId]);

    // Emit invite event (you'll need to add this to your backend)
    socket.emit("inviteFriend", {
      friendId,
      friendUsername,
      roomCode,
      roomName: roomSettings.name || `Room ${roomCode}`,
      inviterUsername: username,
    });

    // Close modal if all friends are invited
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
          <span className="text-lg">Back to Dashboard</span>
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
                  onChange={(e) => handleSettingsChange("name", e.target.value)}
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
                      handleSettingsChange(
                        "maxPlayers",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
                  >
                    {[2, 4, 6, 8, 10, 12].map((num) => (
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
                      handleSettingsChange("rounds", parseInt(e.target.value))
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
                      handleSettingsChange("drawTime", parseInt(e.target.value))
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

                <div className="form-group">
                  <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                    Private Room
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={roomSettings.isPrivate}
                        disabled={!isHost}
                        onChange={(e) =>
                          handleSettingsChange("isPrivate", e.target.checked)
                        }
                        className="w-5 h-5 text-[#118ab2] rounded focus:ring-[#118ab2]"
                      />
                      <span className="text-lg">Private</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Password field for private rooms */}
              {roomSettings.isPrivate && (
                <div className="form-group">
                  <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                    Room Password
                  </label>
                  <input
                    type="password"
                    value={roomSettings.password}
                    disabled={!isHost}
                    onChange={(e) =>
                      handleSettingsChange("password", e.target.value)
                    }
                    placeholder="Enter room password"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Friends Invitation Section */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-[#06d6a0] rounded-full flex items-center justify-center">
                  <UserPlus className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#073b4c]">
                  Invite Friends
                </h2>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-[#06d6a0] text-white px-6 py-3 rounded-full font-bold hover:bg-[#05c090] transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
              >
                <Mail className="w-5 h-5" />
                <span>Invite Friends</span>
              </button>
            </div>

            {/* Invited Friends List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#073b4c] mb-4">
                Invited Friends ({getInvitedFriends().length})
              </h3>
              {getInvitedFriends().length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-lg">
                  No friends invited yet. Click "Invite Friends" to get started!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getInvitedFriends().map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-green-50 border border-green-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#06d6a0] rounded-full flex items-center justify-center text-white font-bold">
                          {friend.avatar ||
                            friend.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#073b4c]">
                            {friend.username}
                          </p>
                          <p className="text-sm text-green-600">
                            {friend.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveInvitedFriend(friend.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FriendsChat for lobby chat */}
        <FriendsChat roomCode={roomCode} username={username} />

        {/* Players in Lobby */}
        <div ref={friendsRef} className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-[#06d6a0] rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#073b4c]">
              Players in Lobby
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
          disabled={
            typeof roomSettings.name !== "string" || !roomSettings.name.trim()
          }
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

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#073b4c]">
                Invite Friends
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {getAvailableFriends().length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No friends available to invite.
                </p>
              ) : (
                getAvailableFriends().map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#06d6a0] rounded-full flex items-center justify-center text-white font-bold">
                        {friend.avatar ||
                          friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#073b4c]">
                          {friend.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {friend.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleInviteFriend(friend.id, friend.username)
                      }
                      className="bg-[#06d6a0] text-white px-4 py-2 rounded-full font-bold hover:bg-[#05c090] transition-all duration-300"
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
  );
};

export default FriendsLobby;
