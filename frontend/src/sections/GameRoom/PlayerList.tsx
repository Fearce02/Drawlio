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

  // Removed the entrance animation for players on every render to prevent glitching/blinking
  // only animating the container once on mount is handled above.

  useEffect(() => {
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
      className="bg-[#F3EDF7] rounded-[24px] shadow-sm border border-[#CAC4D0] overflow-hidden flex flex-col max-h-[70vh] transition-all duration-300"
    >
      <div className="p-4 border-b border-[#E7E0EC] bg-[#EADDFF]/30">
        <h3 className="font-bold text-[#1C1B1F] flex items-center">
          <Users className="w-5 h-5 mr-2 text-[#6750A4]" />
          Players ({players.length})
        </h3>
      </div>

      <div ref={playersContainerRef} className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            data-player-id={player.id}
            className={`flex items-center justify-between p-3 rounded-[16px] border transition-all duration-300 transform hover:scale-[1.02] ${
              player.id === currentDrawerId
                ? "bg-[#6750A4] text-white border-[#6750A4] shadow-lg"
                : player.isConnected
                  ? "bg-white border-[#E7E0EC] hover:border-[#CAC4D0]"
                  : "bg-[#FFDAD6] border-[#FFB4AB]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 overflow-hidden ${
                    player.id === currentDrawerId 
                        ? "bg-white text-[#6750A4]"
                        : player.isConnected
                            ? "bg-[#EADDFF] text-[#21005D]"
                            : "bg-[#FFB4AB] text-[#690005]"
                  }`}
                >
                  {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                      typeof player.name === "string" ? player.name.charAt(0).toUpperCase() : "G"
                  )}
                </div>
                {player.id === currentDrawerId && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#06d6a0] rounded-full flex items-center justify-center animate-bounce border-2 border-[#6750A4]">
                    <Pencil className="w-3 h-3 text-[#003923]" />
                  </div>
                )}
                {index === 0 && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#FFD700] rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                    <Crown className="w-3 h-3 text-[#725C00]" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold text-sm ${player.id === currentDrawerId ? "text-white" : "text-[#1C1B1F]"}`}>
                    {player.name}
                  </span>
                  {player.name === currentPlayerName && (
                    <span className={`flex items-center text-[10px] px-2 py-0.5 rounded-full border ${
                        player.id === currentDrawerId 
                            ? "bg-white text-[#6750A4] border-white" 
                            : "bg-[#E8DEF8] text-[#1D192B] border-[#CAC4D0]"
                    }`}>
                      You
                    </span>
                  )}
                </div>
                <div className={`text-xs ${player.id === currentDrawerId ? "text-[#EADDFF]" : "text-[#49454F]"}`}>
                    {player.id === currentDrawerId ? "is drawing..." : `${player.score} points`}
                </div>
              </div>
            </div>

            <div className="text-right">
              {player.id !== currentDrawerId && (
                 <div className="flex flex-col items-end">
                    <Trophy className={`w-4 h-4 mb-0.5 ${index === 0 ? "text-[#FFD700]" : "text-[#CAC4D0]"}`} />
                 </div>
              )}
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div className="text-center text-[#49454F] py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#E8DEF8] rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-[#1D192B]" />
            </div>
            <p>No players yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
