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
  // Removed unused state
  const navigate = useNavigate();

  // Add debugging to track user state changes
  useEffect(() => {
    console.log("[Dashboard] User state changed:", user);
  }, [user]);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return;
    const u = JSON.parse(userRaw);

    console.log("[Dashboard] Raw user data from localStorage:", u);
    console.log("[Dashboard] User stats from localStorage:", u.stats);

    // Fetch latest user data from database to ensure we have up-to-date stats
    const fetchLatestUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:8000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const latestUserData = await response.json();
          console.log(
            "[Dashboard] Latest user data from database:",
            latestUserData,
          );

          const formattedUser = {
            name: `${latestUserData.firstName} ${latestUserData.lastName}`,
            email: latestUserData.email,
            avatar: latestUserData.avatar,
            level: latestUserData.stats?.level || 1,
            gamesPlayed: latestUserData.stats?.gamesplayed || 0,
            gamesWon: latestUserData.stats?.gamesWon || 0,
            xp: latestUserData.stats?.xp || 0,
            currentXP: latestUserData.stats?.currentXP || 0,
            xpToNextLevel: latestUserData.stats?.xpToNextLevel || 100,
          };

          console.log(
            "[Dashboard] Formatted user object from database:",
            formattedUser,
          );
          setUser(formattedUser);

          // Update localStorage with latest data
          localStorage.setItem("user", JSON.stringify(latestUserData));
        } else {
          console.log(
            "[Dashboard] Failed to fetch latest user data, using localStorage data",
          );
          // Fallback to localStorage data
          const formattedUser = {
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            avatar: u.avatar,
            level: u.stats?.level || 1,
            gamesPlayed: u.stats?.gamesplayed || 0,
            gamesWon: u.stats?.gamesWon || 0,
            xp: u.stats?.xp || 0,
            currentXP: u.stats?.currentXP || 0,
            xpToNextLevel: u.stats?.xpToNextLevel || 100,
          };
          setUser(formattedUser);
        }
      } catch (error) {
        console.error("[Dashboard] Error fetching latest user data:", error);
        // Fallback to localStorage data
        const formattedUser = {
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          avatar: u.avatar,
          level: u.stats?.level || 1,
          gamesPlayed: u.stats?.gamesplayed || 0,
          gamesWon: u.stats?.gamesWon || 0,
          xp: u.stats?.xp || 0,
          currentXP: u.stats?.currentXP || 0,
          xpToNextLevel: u.stats?.xpToNextLevel || 100,
        };
        setUser(formattedUser);
      }
    };

    fetchLatestUserData();

    // Emit user_online event once when dashboard loads
    const userId = u.id || u._id;
    if (userId) {
      console.log(`[Dashboard] Emitting user_online for user: ${userId}`);
      (socket as any).emit("user_online", { userId });
    }

    // Listen for socket connection status
    const handleConnect = () => {
      console.log("[Dashboard] Socket connected");
    };

    const handleDisconnect = () => {
      console.log("[Dashboard] Socket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Listen for stats updates
    const handleStatsUpdated = (data: {
      stats: {
        gamesplayed: number;
        gamesWon: number;
        level: number;
        winRate: number;
        xp: number;
        currentXP: number;
        xpToNextLevel: number;
      };
      xpEarned?: number;
      leveledUp?: boolean;
      levelUpMessage?: string;
    }) => {
      console.log("[Dashboard] Stats updated event received:", data);
      console.log(
        "[Dashboard] Stats data structure:",
        JSON.stringify(data, null, 2),
      );

      // Show level up notification if user leveled up
      if (data.leveledUp && data.levelUpMessage) {
        console.log("[Dashboard] Level up!", data.levelUpMessage);
        // You can add a toast notification here
        alert(data.levelUpMessage);
      }

      // Read current user data from localStorage
      const currentUserRaw = localStorage.getItem("user");
      if (!currentUserRaw) {
        console.log("[Dashboard] No user data found in localStorage");
        return;
      }

      const currentUser = JSON.parse(currentUserRaw);
      console.log("[Dashboard] Current user data:", currentUser);

      const updatedUser = {
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        email: currentUser.email,
        avatar: currentUser.avatar,
        level: data.stats.level,
        gamesPlayed: data.stats.gamesplayed,
        gamesWon: data.stats.gamesWon,
        xp: data.stats.xp,
        currentXP: data.stats.currentXP,
        xpToNextLevel: data.stats.xpToNextLevel,
      };
      console.log("[Dashboard] Updated user object:", updatedUser);
      setUser(updatedUser);

      // Update localStorage with new stats
      const updatedUserData = {
        ...currentUser,
        stats: data.stats,
      };
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      console.log("[Dashboard] Updated localStorage with new stats");
    };

    socket.on("statsUpdated", handleStatsUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("statsUpdated", handleStatsUpdated);
    };
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
      xp: 0,
      currentXP: 0,
      xpToNextLevel: 100,
    };
    const formattedUser = {
      name: `${updatedUserFromBackend.firstName} ${updatedUserFromBackend.lastName}`,
      email: updatedUserFromBackend.email,
      avatar: updatedUserFromBackend.avatar,
      level: stats.level,
      gamesPlayed: stats.gamesplayed,
      gamesWon: stats.gamesWon,
      xp: stats.xp,
      currentXP: stats.currentXP,
      xpToNextLevel: stats.xpToNextLevel,
    };
    setUser(formattedUser);
    localStorage.setItem("user", JSON.stringify(updatedUserFromBackend)); // update storage too
    setEditingProfile(false);
  };

  // handleCreateRoom is now passed to MainContent

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
              xp: user.xp,
              currentXP: user.currentXP,
              xpToNextLevel: user.xpToNextLevel,
            }}
            onCreateRoom={() => navigate("/friends-lobby")}
            onViewFriends={handleViewFriends}
            onJoinRoom={(roomCode) =>
              navigate(`/friends-lobby?roomCode=${roomCode}`)
            }
          />
        )}
      </div>
      {/* FriendsChat floating chat for signed-in users only */}
      {!guestUsername && userId && username && (
        <FriendsChat roomCode={"dashboard"} username={username} />
      )}
    </>
  );
};

export default Dashboard;
