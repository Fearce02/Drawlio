import React, { useEffect, useState } from "react";
import MainContent from "./MainContent";
import Navbar from "../components/ui/Navbar";
import EditProfile from "./EditProfile";
import { useNavigate } from "react-router-dom";
import socket from "../sockets/socket";
import FriendsChat from "./FriendsSection/FriendsChat";

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
    const userRaw = localStorage.getItem("user");
    let userId = null;
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u && u.id) {
          userId = u.id;
        } else if (u && u._id) {
          userId = u._id;
        }
      } catch {}
    }
    if (userId) {
      (socket as any).emit("user_offline", { userId });
    }
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
    navigate("/friends");
  };

  if (!user) return <div>Loading...</div>;

  // Only show FriendsChat if not a guest
  const userRaw = localStorage.getItem("user");
  const guestUsername = localStorage.getItem("guestUsername");
  let userId = null;
  let username = null;
  if (userRaw) {
    try {
      const u = JSON.parse(userRaw);
      userId = u.id || u._id;
      username = u.username || u.email || user.name;
      // Clear guestUsername if user is registered (has userId)
      if (userId && guestUsername) {
        localStorage.removeItem("guestUsername");
      }
    } catch {}
  }

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
            onViewFriends={handleViewFriends}
          />
        )}
      </div>
      {/* FriendsChat floating chat for signed-in users only */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          zIndex: 9999,
          background: "red",
          color: "white",
          padding: "8px",
        }}
      >
        DEBUG MARKER
      </div>
      {!guestUsername && userId && username && (
        <FriendsChat roomCode={"dashboard"} username={username} />
      )}
    </>
  );
};

export default Dashboard;
