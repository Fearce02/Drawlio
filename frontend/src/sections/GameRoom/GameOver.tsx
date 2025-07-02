import React, { useEffect, useRef } from 'react';
import { Trophy, Users, RotateCcw, LogOut, Crown, Medal, Award } from 'lucide-react';
import { gsap } from 'gsap';

interface Player {
  id: string;
  username: string;
  score: number;
  isCurrentPlayer?: boolean;
}

interface GameOverProps {
  players: Player[];
  onPlayAgain: () => void;
  onExit: () => void;
  totalRounds: number;
  currentPlayerName: string;
}

export const GameOver: React.FC<GameOverProps> = ({
  players,
  onPlayAgain,
  onExit,
  totalRounds,
  currentPlayerName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const currentPlayerRank = sortedPlayers.findIndex(p => p.username === currentPlayerName) + 1;
  const currentPlayerScore = sortedPlayers.find(p => p.username === currentPlayerName)?.score || 0;

  useEffect(() => {
    if (containerRef.current && leaderboardRef.current && buttonsRef.current) {
      const tl = gsap.timeline();

      // Initial setup
      gsap.set(containerRef.current, { opacity: 0, scale: 0.8 });
      gsap.set(leaderboardRef.current.children, { opacity: 0, x: 50 });
      gsap.set(buttonsRef.current.children, { opacity: 0, y: 30 });

      // Animate container
      tl.to(containerRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      })
      // Animate leaderboard items
      .to(leaderboardRef.current.children, {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.3")
      // Animate buttons
      .to(buttonsRef.current.children, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.7)"
      }, "-=0.2");

      // Confetti animation
      if (confettiRef.current) {
        const confettiElements = confettiRef.current.children;
        gsap.fromTo(confettiElements, 
          { 
            rotation: 0,
            y: 0,
            opacity: 1 
          },
          {
            rotation: 360,
            y: -100,
            opacity: 0,
            duration: 2,
            stagger: 0.1,
            ease: "power2.out",
            repeat: -1,
            repeatDelay: 1
          }
        );
      }
    }
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "from-gray-300 to-gray-500 text-white";
      case 3:
        return "from-amber-400 to-amber-600 text-white";
      default:
        return "from-blue-100 to-blue-200 text-blue-900";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 flex items-center justify-center">
      {/* Confetti Background */}
      <div ref={confettiRef} className="fixed inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div
        ref={containerRef}
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-auto border border-white/20 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Game Over!
            </h1>
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl inline-block">
            <p className="text-lg font-semibold">
              🎉 {winner.username} Wins! 🎉
            </p>
            <p className="text-sm opacity-90">
              {totalRounds} rounds completed • {players.length} players
            </p>
          </div>
        </div>

        {/* Current Player Stats */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Your Result</h3>
              <p className="text-lg opacity-90">Rank #{currentPlayerRank} • {currentPlayerScore} points</p>
            </div>
            <div className="text-right">
              {getRankIcon(currentPlayerRank)}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Final Leaderboard</h2>
          </div>
          
          <div ref={leaderboardRef} className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                  player.username === currentPlayerName
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(index + 1)} flex items-center justify-center shadow-lg`}>
                    {getRankIcon(index + 1)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {player.username}
                      {player.username === currentPlayerName && (
                        <span className="text-blue-600 ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{player.score} points</p>
                  </div>
                </div>
                
                {index === 0 && (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg
                     hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200
                     shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
          >
            <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
            Play Again
          </button>
          
          <button
            onClick={onExit}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-2xl font-bold text-lg
                     hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200
                     shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
          >
            <LogOut className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
            Exit to Lobby
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Thanks for playing! 🎨✨
          </p>
        </div>
      </div>
    </div>
  );
};