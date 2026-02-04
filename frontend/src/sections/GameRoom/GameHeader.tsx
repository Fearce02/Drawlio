import React, { useEffect, useRef } from "react";
import { Clock, Users, Trophy } from "lucide-react";
import type { GameState } from "../../types/game";
import { gsap } from "gsap";

interface GameHeaderProps {
  gameState: GameState;
  playerCount: number;
  isCurrentPlayerDrawing: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  playerCount,
  isCurrentPlayerDrawing,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
      );
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      if (gameState.timeLeft <= 10) {
        gsap.to(timerRef.current, {
          scale: 1.1,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        });
      }
    }
  }, [gameState.timeLeft]);

  useEffect(() => {
    if (wordRef.current && gameState.currentWord) {
      gsap.fromTo(
        wordRef.current,
        { scale: 0, rotation: -10 },
        { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" },
      );
    }
  }, [gameState.currentWord]);

  useEffect(() => {
    if (roundRef.current) {
      gsap.fromTo(
        roundRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      );
    }
  }, [gameState.currentRound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={headerRef}
      className="bg-[#F3EDF7] rounded-[24px] shadow-sm border border-[#E7E0EC] p-4 mb-4 overflow-hidden relative"
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-6">
          <div ref={roundRef} className="flex items-center space-x-2 bg-[#EADDFF] px-3 py-1.5 rounded-full">
            <Trophy className="w-5 h-5 text-[#6750A4]" />
            <span className="font-bold text-[#21005D] text-sm">
              Round {gameState.currentRound}/{gameState.maxRounds}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[#49454F]">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">{playerCount} players</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isCurrentPlayerDrawing &&
            gameState.currentWord &&
            gameState.gamePhase === "drawing" && (
              <div
                ref={wordRef}
                className="bg-[#6750A4] text-white px-6 py-2 rounded-full shadow-md"
              >
                <span className="font-bold tracking-wide">
                  Word: {gameState.currentWord}
                </span>
              </div>
            )}

          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-[#E7E0EC]">
            <Clock className={`w-5 h-5 ${gameState.timeLeft <= 10 ? "text-[#B3261E]" : "text-[#6750A4]"}`} />
            <span
              ref={timerRef}
              className={`font-bold text-lg transition-colors duration-300 ${
                gameState.timeLeft <= 10 ? "text-[#B3261E]" : "text-[#1C1B1F]"
              }`}
            >
              {formatTime(gameState.timeLeft)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
