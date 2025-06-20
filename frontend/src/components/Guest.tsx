import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import socket from "../sockets/socket";

type Player = {
  username: string;
  isHost: Boolean;
};

const Lobby: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const username = localStorage.getItem("guestUsername") || "Guest";

  useEffect(() => {
    if (!roomCode || !username) return;

    socket.emit("joinRoom", { username, roomCode });
    console.log(`Joining room: ${roomCode} as ${username}`);

    socket.on("playerJoined", (updatedPlayers: Player[]) => {
      console.log("Player joined:", updatedPlayers);
      setPlayers(updatedPlayers);
      const current = updatedPlayers.find((p) => p.username === username);
      if (current?.isHost) setIsHost(true);
    });

    socket.on("gameStarted", (data: { message: string }) => {
      console.log(data.message);
      // Game Started Logic to be implement here : Navigate to game page.
    });

    return () => {
      socket.off("playerJoined");
      socket.off("gameStarted");
    };
  }, [roomCode, username]);

  const handleStart = () => {
    if (roomCode) {
      socket.emit("startGame", { roomCode });
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Lobby Code: {roomCode}</h1>

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Players in Lobby:</h2>
        <ul>
          {players.map((player, idx) => (
            <li key={idx}>
              {player.username} {player.isHost && "(Host)"}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <button
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleStart}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default Lobby;
