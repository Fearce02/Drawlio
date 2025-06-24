import React, { useState, useEffect } from "react";
import socket from "../sockets/socket";

type GuestPlayer = {
  username: string;
};

const Lobby: React.FC = () => {
  const [players, setPlayers] = useState<GuestPlayer[]>([]);

  useEffect(() => {
    const username = localStorage.getItem("guestUsername");

    if (username) {
      socket.emit("joinGuestLobby", { username });
    }

    socket.on("guestLobbyUpdate", ({ players }) => {
      setPlayers(players);
    });

    return () => {
      socket.off("guestLobbyUpdate");
    };
  });

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Guest Lobby</h1>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Players in Lobby:</h2>
        <ul className="list-disc ml- mt-2">
          {players.map((player, index) => (
            <li key={index}> {player.username}</li>
          ))}
        </ul>
      </div>

      <button className="mt-6 bg-blue-500 text-white px-4 py-2 rounded">
        Start Game
      </button>
    </div>
  );
};

export default Lobby;
