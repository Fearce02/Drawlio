import { GameRoom } from "../models/GameRoom.js";

const guestRooms = {};

export const handleLobbySockets = (io, socket) => {
  socket.on("join_lobby", ({ roomCode, username }) => {
    socket.join(roomCode);
    socket.data.username = username;

    if (!guestRooms[roomCode]) guestRooms[roomCode] = [];

    const alreadyExists = guestRooms[roomCode].some(
      (p) => p.socketId === socket.id || p.username === username,
    );

    if (!alreadyExists) {
      guestRooms[roomCode].push({ socketId: socket.id, username });
    }

    const players = guestRooms[roomCode].map((p) => ({
      username: p.username,
    }));

    io.to(roomCode).emit("PlayerJoined", players);
  });

  socket.on("startGame", ({ roomCode }) => {
    io.to(roomCode).emit("GameStarted", {
      message: "Game Has Started",
      settings: { totalRounds: 3, round: 1 },
    });
  });

  socket.on("disconnect", () => {
    for (const roomCode in guestRooms) {
      const index = guestRooms[roomCode].findIndex(
        (p) => p.socketId === socket.id,
      );
      if (index !== -1) {
        guestRooms[roomCode].splice(index, 1);

        if (guestRooms[roomCode].length === 0) delete guestRooms[roomCode];
        else {
          const players = guestRooms[roomCode].map((p) => ({
            username: p.username,
          }));
          io.to(roomCode).emit("PlayerJoined", players);
        }
        break;
      }
    }
  });
};
// export const handleLobbySockets = (io, socket) => {
//   socket.on("join-lobby", async ({ username, roomCode }) => {
//     socket.join(roomCode);
//     socket.data.username = username;

//     const room = await GameRoom.findOne({ code: roomCode });
//     if (!room) return;

//     const players = room.players.map((p) => ({
//       username: p.username,
//       isHost: p.username === room.host,
//     }));

//     io.to(roomCode).emit("PlayerJoined", players);
//   });

//   socket.on("startGame", async ({ roomCode }) => {
//     const room = await GameRoom.findOne({ code: roomCode });
//     if (!room) return;

//     io.to(roomCode).emit("GameStarted", {
//       message: "Game Has Started",
//       settings: {
//         totalRounds: room.totalRounds,
//         round: 1,
//       },
//     });
//   });
// };
