import React, { useEffect, useState } from "react";
import MainContent from "./MainContent";
import Navbar from "../components/ui/Navbar";
import EditProfile from "./EditProfile";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  //   const [usern, setUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return;
    const u = JSON.parse(userRaw);

    const formattedUser = {
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      avatar: u.avatar,
      level: u.stats?.level || 1,
      gamesPlayed: u.stats?.gamesplayed || 0,
      gamesWon: u.stats?.gamesWon || 0,
    };

    setUser(formattedUser);
  }, []);

  const handleSignout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleEditProfile = () => setEditingProfile(true);
  const handleCancelEdit = () => setEditingProfile(false);

  const handleSaveProfile = (updatedUserFromBackend: any) => {
    const stats = updatedUserFromBackend.stats || {
      level: 1,
      gamesplayed: 0,
      gamesWon: 0,
    };
    const formattedUser = {
      name: `${updatedUserFromBackend.firstName} ${updatedUserFromBackend.lastName}`,
      email: updatedUserFromBackend.email,
      avatar: updatedUserFromBackend.avatar,
      level: stats.level,
      gamesPlayed: stats.gamesplayed,
      gamesWon: stats.gamesWon,
    };
    setUser(formattedUser);
    localStorage.setItem("user", JSON.stringify(updatedUserFromBackend)); // update storage too
    setEditingProfile(false);
  };

  const handleCreateRoom = () => {
    console.log("Create room clicked!");
    setShowLobby(true);
    // Navigate or trigger room creation
  };

  const handleViewFriends = () => {
    console.log("View friends clicked!");
    // Navigate or show friends list
  };

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Navbar
        user={user}
        onSignOut={handleSignout}
        onEditProfile={handleEditProfile}
      />
      <div className="pt-20 px-4">
        {editingProfile ? (
          <EditProfile
            user={user}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
          />
        ) : (
          <MainContent
            user={{
              name: user.name,
              level: user.level,
              gamesPlayed: user.gamesPlayed,
              gamesWon: user.gamesWon,
            }}
            onCreateRoom={() => console.log("Create room clicked")}
            onViewFriends={() => console.log("View friends clicked")}
          />
        )}
      </div>
    </>
  );
};

export default Dashboard;
