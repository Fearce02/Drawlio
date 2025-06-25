import React from "react";
import { Plus, Users, Trophy, Clock, Star, Play } from "lucide-react";

interface MainContentProps {
  user: {
    name: string;
    level: number;
    gamesPlayed: number;
    gamesWon: number;
  };
  onCreateRoom: () => void;
  onViewFriends: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  user,
  onCreateRoom,
  onViewFriends,
}) => {
  const winRate = Math.round((user.gamesWon / user.gamesPlayed) * 100);

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
          <div className="flex items-center justify-between">
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
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#118ab2] text-lg"
            />
            <button className="bg-[#118ab2] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#0f7a9c] transition-all duration-200 transform hover:scale-105">
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
