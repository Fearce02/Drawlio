import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Settings,
  Users,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { gsap } from "gsap";
// import {
//   fadeInUp,
//   slideInFromLeft,
//   slideInFromRight,
//   staggerFadeIn,
// } from "../hooks/useGSAP";

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

const FriendsLobby: React.FC<CreateRoomProps> = ({ friends, onBack }) => {
  const [roomSettings, setRoomSettings] = useState({
    name: "",
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    isPrivate: false,
    password: "",
  });

  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [roomCode] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase(),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  const onlineFriends = friends.filter((friend) => friend.status === "online");

  useEffect(() => {
    // Page entrance animations
    if (headerRef.current) {
      slideInFromLeft(headerRef.current, 0.1);
    }

    if (settingsRef.current) {
      fadeInUp(settingsRef.current, 0.3);
    }

    if (friendsRef.current) {
      slideInFromRight(friendsRef.current, 0.5);
    }

    if (createButtonRef.current) {
      gsap.fromTo(
        createButtonRef.current,
        { opacity: 0, y: 50, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: 0.7,
          ease: "back.out(1.7)",
        },
      );
    }

    // Animate form elements
    staggerFadeIn(".form-group", 0.8);
  }, []);

  const toggleFriend = (friendId: number) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );

    // Add selection animation
    const friendElement = document.querySelector(
      `[data-friend-id="${friendId}"]`,
    );
    if (friendElement) {
      gsap.to(friendElement, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  };

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

  const handleCreateRoom = () => {
    console.log("Creating room with settings:", roomSettings);
    console.log("Invited friends:", selectedFriends);

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

  const handleToggleSwitch = () => {
    setRoomSettings({ ...roomSettings, isPrivate: !roomSettings.isPrivate });

    // Toggle animation
    const toggle = event?.currentTarget;
    if (toggle) {
      gsap.to(toggle, {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
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
                  onChange={(e) =>
                    setRoomSettings({ ...roomSettings, name: e.target.value })
                  }
                  placeholder="My Awesome Drawing Room"
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

                <div className="form-group">
                  <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                    Privacy
                  </label>
                  <div className="flex items-center justify-between px-6 py-4 border-2 border-gray-200 rounded-full">
                    <span className="text-[#073b4c] font-medium text-lg">
                      Private Room
                    </span>
                    <button
                      onClick={handleToggleSwitch}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                        roomSettings.isPrivate ? "bg-[#06d6a0]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                          roomSettings.isPrivate
                            ? "translate-x-7"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              {roomSettings.isPrivate && (
                <div className="form-group">
                  <label className="block text-sm font-bold text-[#073b4c] mb-3 uppercase tracking-wide">
                    Room Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={roomSettings.password}
                      onChange={(e) =>
                        setRoomSettings({
                          ...roomSettings,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter room password"
                      className="w-full px-6 py-4 pr-14 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg transition-all duration-300 focus:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#073b4c] transition-colors duration-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-6 h-6" />
                      ) : (
                        <Eye className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div ref={friendsRef} className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-[#06d6a0] rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#073b4c]">
              Invite Friends
            </h2>
          </div>

          <div className="space-y-4">
            {onlineFriends.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-lg">
                No friends are currently online
              </p>
            ) : (
              onlineFriends.map((friend, index) => (
                <div
                  key={friend.id}
                  data-friend-id={friend.id}
                  className={`flex items-center space-x-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedFriends.includes(friend.id)
                      ? "bg-[#06d6a0] text-white"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => toggleFriend(friend.id)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#06d6a0] border-2 border-white rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-bold ${selectedFriends.includes(friend.id) ? "text-white" : "text-[#073b4c]"}`}
                    >
                      {friend.name}
                    </p>
                    <p
                      className={`text-sm ${selectedFriends.includes(friend.id) ? "text-emerald-100" : "text-[#06d6a0]"}`}
                    >
                      Online
                    </p>
                  </div>
                  {selectedFriends.includes(friend.id) && (
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-[#06d6a0]" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {selectedFriends.length > 0 && (
            <div className="mt-8 p-6 bg-[#06d6a0] rounded-2xl text-white">
              <p className="font-bold text-lg mb-2">
                {selectedFriends.length} friend
                {selectedFriends.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-emerald-100">
                They will receive an invitation when you create the room
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Button */}
      <div className="mt-12 flex justify-center">
        <button
          ref={createButtonRef}
          onClick={handleCreateRoom}
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
          Create Room & Start Playing
        </button>
      </div>
    </div>
  );
};

export default FriendsLobby;
