import React, { useRef, useEffect } from "react";
import { Crown, Pencil, Users, Trophy, User } from "lucide-react";
import type { Player } from "../../types/game";
import { gsap } from "gsap";

interface PlayerListProps {
  players: Player[];
  currentDrawerId?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentDrawerId,
}) => {
  const playerListRef = useRef<HTMLDivElement>(null);
  const playersContainerRef = useRef<HTMLDivElement>(null);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Get current player name from localStorage
  const currentPlayerName = localStorage.getItem("guestUsername") || "Guest";

  useEffect(() => {
    if (playerListRef.current) {
      gsap.fromTo(
        playerListRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
      );
    }
  }, []);

  useEffect(() => {
    if (playersContainerRef.current) {
      const playerElements = playersContainerRef.current.children;
      gsap.fromTo(
        playerElements,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 0.3,
        },
      );
    }
  }, [sortedPlayers]);

  useEffect(() => {
    // Animate current drawer change
    const currentDrawerElement = document.querySelector(
      `[data-player-id="${currentDrawerId}"]`,
    );
    if (currentDrawerElement) {
      gsap.fromTo(
        currentDrawerElement,
        { scale: 1 },
        {
          scale: 1.05,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        },
      );
    }
  }, [currentDrawerId]);

  return (
    <div
      ref={playerListRef}
      className="bg-white rounded-lg shadow-sm border border-gray-200 transform"
    >
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Players ({players.length})
        </h3>
      </div>

      <div ref={playersContainerRef} className="p-4 space-y-3">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            data-player-id={player.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 transform hover:scale-105 hover:shadow-md ${
              player.id === currentDrawerId
                ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500 shadow-xl ring-2 ring-blue-300"
                : player.isConnected
                  ? "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200"
                  : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    player.isConnected
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-gradient-to-r from-gray-400 to-gray-500"
                  }`}
                >
                  {typeof player.name === "string"
                    ? player.name.charAt(0).toUpperCase()
                    : "G"}
                </div>
                {player.id === currentDrawerId && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <Pencil className="w-2 h-2 text-white" />
                  </div>
                )}
                {index === 0 && (
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                    <Crown className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-800 flex items-center">
                    {player.name}
                    {player.id === currentDrawerId && (
                      <Pencil className="w-4 h-4 ml-1 text-blue-500 animate-pulse" />
                    )}
                  </span>
                  {player.name === currentPlayerName && (
                    <span className="flex items-center text-xs bg-blue-500 text-white px-2 py-1 rounded-full border border-blue-600 ml-1">
                      <User className="w-3 h-3 mr-1" />
                      You
                    </span>
                  )}
                  {index === 0 && (
                    <span className="text-xs bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-2 py-1 rounded-full border border-yellow-300">
                      Leader
                    </span>
                  )}
                  {player.id === currentDrawerId && (
                    <span className="flex items-center text-xs bg-green-500 text-white px-2 py-1 rounded-full border border-green-600 animate-pulse ml-1">
                      <Pencil className="w-3 h-3 mr-1" />
                      Drawing
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {player.isConnected ? (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                      Disconnected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center text-gray-700">
                <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                <span className="font-bold text-lg">{player.score}</span>
              </div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p>No players in the room yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
