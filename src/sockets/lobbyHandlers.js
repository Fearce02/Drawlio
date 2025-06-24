import { GameRoom } from "../models/GameRoom.js";

export const handleLobbySockets = (io, socket) => {
  socket.on("join-lobby", async ({ username, roomCode }) => {
    socket.join("roomCode");
    socket.data.username = username;

    const room = await GameRoom.findOne({ code: roomCode });
    if (!room) return;

    const players = room.players.map((p) => ({
      username: p.username,
      isHost: p.username === room.host,
    }));

    io.to(roomCode).emit("PlayerJoined", players);
  });

  socket.on("startGame", async ({ roomCode }) => {
    const room = await GameRoom.findOne({ code: roomCode });
    if (!room) return;

    io.to(roomCode).emit("GameStarted", {
      message: "Game Has Started",
      settings: {
        totalRounds: room.totalRounds,
        round: 1,
      },
    });
  });

  socket.on("joinGuestLobby", ({ username }) => {
    socket.username = username;
    socket.join("guest-lobby");

    const guestSockets = Array.from(
      io.sockets.adapter.rooms.get("guest-lobby") || [],
    );
    const players = guestSockets
      .map((id) => {
        const s = io.sockets.sockets.get(id);
        return s?.username ? { username: s.username } : null;
      })
      .filter(Boolean);
    io.to("guest-lobby").emit("guestLobbyUpdate", { players });
  });
};
