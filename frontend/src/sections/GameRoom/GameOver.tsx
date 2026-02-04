import React, { useEffect, useRef } from 'react';
import { Trophy, Users, RotateCcw, LogOut, Crown, Medal, Award } from 'lucide-react';
import { gsap } from 'gsap';

interface Player {
  id: string;
  username: string;
  score: number;
  isCurrentPlayer?: boolean;
  avatar?: string;
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
        return <Crown className="w-6 h-6 text-[#FFD700]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#A0A0A0]" />;
      case 3:
        return <Award className="w-6 h-6 text-[#CD7F32]" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-[#49454F] font-bold">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-[#FFD700] text-[#725C00]";
      case 2: return "bg-[#E0E0E0] text-[#1C1B1F]";
      case 3: return "bg-[#FFDBC8] text-[#5D4037]";
      default: return "bg-[#E7E0EC] text-[#49454F]";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDF8FC] overflow-y-auto py-10">
      {/* Confetti Background */}
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#6750A4', '#D0BCFF', '#FFD8E4', '#7D5260'][Math.floor(Math.random() * 4)],
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
         <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#D0BCFF] opacity-20 blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EFB8C8] opacity-20 blur-[80px]" />
      </div>

      <div
        ref={containerRef}
        className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-xl p-8 max-w-2xl w-full mx-4 border border-[#E7E0EC] relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-[#FFD700]" />
          </div>
          <h1 className="text-4xl font-bold text-[#1C1B1F] mb-2 tracking-tight">
            Game Over!
          </h1>
          
          <div className="bg-[#6750A4] text-white px-8 py-3 rounded-full inline-block shadow-md">
            <p className="text-lg font-bold flex items-center gap-2">
               {winner.avatar && <img src={winner.avatar} alt="Winner" className="w-8 h-8 rounded-full bg-white object-cover" />}
              🎉 {winner.username} Wins! 🎉
            </p>
          </div>
           <p className="text-sm text-[#49454F] mt-4 font-medium">
              {totalRounds} rounds completed • {players.length} players
            </p>
        </div>

        {/* Current Player Stats */}
        <div className="bg-[#EADDFF] text-[#21005D] rounded-[24px] p-6 mb-8 border border-[#D0BCFF] flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Your Result</h3>
              <p className="text-sm opacity-80">Rank #{currentPlayerRank}</p>
            </div> 
            <div className="text-right">
                <p className="text-3xl font-bold">{currentPlayerScore}</p>
                <p className="text-sm opacity-80 uppercase tracking-wider font-medium">Points</p>
            </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Users className="w-5 h-5 text-[#6750A4]" />
            <h2 className="text-lg font-bold text-[#1C1B1F]">Leaderboard</h2>
          </div>
          
          <div ref={leaderboardRef} className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-[20px] transition-all duration-200 ${
                  player.username === currentPlayerName
                    ? 'bg-[#F3EDF7] border border-[#6750A4] ring-1 ring-[#6750A4]'
                    : 'bg-white border border-[#E7E0EC] hover:bg-[#F3EDF7]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm overflow-hidden ${getRankColor(index + 1)}`}>
                    {player.avatar ? (
                         <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
                    ) : (
                        index + 1
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#1C1B1F] text-lg">
                      {player.username}
                      {player.username === currentPlayerName && (
                        <span className="text-[#6750A4] text-sm ml-2 font-medium">(You)</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="font-bold text-[#1C1B1F]">{player.score} pts</span>
                    {index < 3 && getRankIcon(index + 1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#E7E0EC]">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-[#6750A4] text-white px-8 py-4 rounded-full font-bold text-lg
                     hover:bg-[#523E8E] transform hover:scale-[1.02] transition-all duration-200
                     shadow-md flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
          
          <button
            onClick={onExit}
            className="flex-1 bg-white text-[#6750A4] border border-[#79747E] px-8 py-4 rounded-full font-bold text-lg
                     hover:bg-[#F3EDF7] transform hover:scale-[1.02] transition-all duration-200
                     flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            Exit to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};