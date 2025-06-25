import React, { useEffect, useState } from "react";
import MainContent from "./MainContent";

const Dashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return;

    const user = JSON.parse(userRaw);

    const formattedUser = {
      name: `${user.firstName} ${user.lastName}`,
      level: user.stats?.level || 1,
      gamesPlayed: user.stats?.gamesplayed || 0,
      gamesWon: user.stats?.gamesWon || 0,
    };

    setUserStats(formattedUser);
  }, []);

  const handleCreateRoom = () => {
    console.log("Create room clicked!");
    // Navigate or trigger room creation
  };

  const handleViewFriends = () => {
    console.log("View friends clicked!");
    // Navigate or show friends list
  };

  if (!userStats) return <div>Loading...</div>;

  return (
    <MainContent
      user={userStats}
      onCreateRoom={handleCreateRoom}
      onViewFriends={handleViewFriends}
    />
  );
};

export default Dashboard;
