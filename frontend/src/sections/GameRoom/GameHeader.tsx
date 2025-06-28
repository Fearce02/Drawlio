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
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div ref={roundRef} className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-700">
              Round {gameState.currentRound}/{gameState.maxRounds}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-gray-600">{playerCount} players</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isCurrentPlayerDrawing &&
            gameState.currentWord &&
            gameState.gamePhase === "drawing" && (
              <div
                ref={wordRef}
                className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg border border-blue-200"
              >
                <span className="text-blue-700 font-medium">
                  Word: {gameState.currentWord}
                </span>
              </div>
            )}

          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-red-500" />
            <span
              ref={timerRef}
              className={`font-bold text-lg transition-colors duration-300 ${
                gameState.timeLeft <= 10 ? "text-red-500" : "text-gray-700"
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
