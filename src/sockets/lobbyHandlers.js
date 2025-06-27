import { GameRoom } from "../models/GameRoom.js";

const guestRooms = {};

export const handleLobbySockets = (io, socket) => {
  socket.on("join_lobby", ({ roomCode, username }) => {
    socket.join(roomCode);
    socket.data.username = username;

    if (!guestRooms[roomCode]) {
      guestRooms[roomCode] = {
        host: username,
        players: [],
        settings: {
          maxPlayers: 4,
          roundDuration: 60,
          isPrivate: false,
          password: "",
        },
      };
    }

    const room = guestRooms[roomCode];

    if (!room.players.some((p) => p.username === username)) {
      room.players.push({ socketId: socket.id, username });
    } else {
      room.players = room.players.map((p) =>
        p.username === username ? { ...p, socketId: socket.id } : p,
      );
    }

    if (room.host === username) {
      room.host = username;
    }
    const players = room.players.map((p) => ({ username: p.username }));

    io.to(roomCode).emit("PlayerJoined", players);
    io.to(socket.id).emit("HostAssigned", { host: room.host });
    io.to(socket.id).emit("lobbySettingsUpdated", room.settings);
  });

  socket.on("updateSettings", (roomCode, settings) => {
    const room = guestRooms[roomCode];
    if (!room) return;

    if (socket.data.username !== room.host) return;

    room.settings = settings;
    io.to(roomCode).emit("lobbySettingsUpdated", settings);
  });

  socket.on("startGame", ({ roomCode }) => {
    const room = guestRooms[roomCode];
    if (!room) return;
    io.to(roomCode).emit("GameStarted", {
      message: "Game Has Started",
      settings: room.settings,
    });
  });

  socket.on("disconnect", () => {
    for (const roomCode in guestRooms) {
      const room = guestRooms[roomCode];
      const index = room.players.findIndex((p) => p.socketId === socket.id);
      if (index !== -1) {
        const [disconnected] = room.players.splice(index, 1);

        if (disconnected.username === room.host && room.players.length > 0) {
          room.host = room.players[0].username;
          io.to(roomCode).emit("HostAssigned", { host: room.host });
        }

        if (room.players.length === 0) {
          delete guestRooms[roomCode];
        } else {
          const players = room.players.map((p) => ({ username: p.username }));
          io.to(roomCode).emit("PlayerJoined", players);
        }

        break;
      }
    }
  });
};
