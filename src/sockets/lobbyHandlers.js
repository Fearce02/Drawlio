import { User } from "../models/UserSchema.js";

const guestRooms = {};
const words = [
  "Elephant",
  "Spaceship",
  "Pineapple",
  "Dragon",
  "Mountain",
  "Tornado",
  "F1",
  "Ferrari",
  "Football",
  "Basketball",
  "Computer",
  "Giraffe",
  "Chocolate",
  "Rainbow",
  "Volcano",
  "Robot",
  "Castle",
  "Pirate",
  "Mermaid",
  "Treasure",
  "Galaxy",
  "Jungle",
];

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
          totalRounds: 3,
          roundDuration: 60,
          isPrivate: false,
          password: "",
        },
        gameState: {
          isActive: false,
          currentRound: 0,
          drawerIndex: 0,
          currentWord: null,
          timer: null,
          totalTurns: 0,
        },
        joinedPlayers: [],
        _gameStarted: false,
      };
    }

    const room = guestRooms[roomCode];

    if (!room.players.some((p) => p.username === username)) {
      room.players.push({ socketId: socket.id, username, score: 0 });
    } else {
      room.players = room.players.map((p) =>
        p.username === username
          ? { ...p, socketId: socket.id, score: p.score || 0 }
          : p,
      );
    }

    io.to(roomCode).emit(
      "PlayerJoined",
      room.players.map((p) => ({
        id: p.socketId,
        name: p.username,
        score: p.score || 0,
        isConnected: true,
        isDrawing: p.isDrawing || false,
      })),
    );
    io.to(socket.id).emit("HostAssigned", { host: room.host });
    io.to(socket.id).emit("lobbySettingsUpdated", room.settings);
  });

  socket.on("guest_lobby_chat", ({ roomCode, username, message }) => {
    if (!roomCode || !username || !message) return;
    const timestamp = Date.now();
    io.to(roomCode).emit("guest_lobby_chat", {
      roomCode,
      username,
      message,
      timestamp,
    });
  });

  socket.on("updateSettings", ({ roomCode, settings }) => {
    const room = guestRooms[roomCode];
    if (!room || socket.data.username !== room.host) return;
    room.settings = settings;
    io.to(roomCode).emit("lobbySettingsUpdated", settings);
  });

  socket.on("startGame", ({ roomCode }) => {
    console.log(`[startGame] Triggered for room: ${roomCode}`);
    const room = guestRooms[roomCode];
    if (!room) return;

    room.gameState.isActive = true;
    room.gameState.currentRound = 1;
    room.gameState.drawerIndex = 0;
    room.joinedPlayers = [];
    room._gameStarted = false;
    room.gameState.totalTurns = 0;

    // const drawer = room.players[room.gameState.drawerIndex];
    // const roundDuration = room.settings.roundDuration;
    io.to(roomCode).emit("GameStarted", {
      message: "Game has started",
    });

    // io.to(roomCode).emit("GameStarted", {
    //   message: "Game Has Started",
    //   settings: room.settings,
    //   drawer: drawer.username,
    //   round: 1,
    //   time: roundDuration,
    // });
    // console.log("[startGame] Using settings:", room.settings);
    // startNextTurn(io, roomCode);
  });

  socket.on("joinGameRoom", ({ roomCode, username }) => {
    console.log(
      `[joinGameRoom] ${username} (${socket.id}) joined game room: ${roomCode}`,
    );
    socket.join(roomCode);
    socket.data.username = username;

    const room = guestRooms[roomCode];
    if (!room) return;
    if (!room.joinedPlayers.includes(username)) {
      room.joinedPlayers.push(username);
    }

    const allJoined = room.joinedPlayers.length === room.players.length;

    if (allJoined && !room._gameStarted) {
      room._gameStarted = true;
      console.log(
        `[joinGameRoom] All players joined. Starting game for room: ${roomCode}`,
        startNextTurn(io, roomCode),
      );
    }
  });

  socket.on("drawing", ({ roomCode, from, to, color, brushSize }) => {
    io.to(roomCode).emit("drawing", { from, to, color, brushSize });
  });

  socket.on("clearCanvas", ({ roomCode }) => {
    io.to(roomCode).emit("clearCanvas");
  });

  socket.on("sendGuess", ({ roomCode, message }) => {
    const room = guestRooms[roomCode];
    if (!room || !room.gameState.currentWord) return;

    const gameState = room.gameState;
    const now = Date.now();
    const player = room.players.find((p) => p.socketId === socket.id);
    if (
      !player ||
      room.gameState.playersGuessedCorrectly.includes(player.username)
    )
      return;

    const isCorrect =
      message.trim().toLowerCase() === room.gameState.currentWord.toLowerCase();
    if (isCorrect) {
      const timeElapsed = (now - gameState.roundStartTime) / 1000;
      const timeLeft = Math.max(0, room.settings.roundDuration - timeElapsed);

      let score = 0;
      if (timeLeft > 50) score = 100;
      else if (timeLeft > 30) score = 70;
      else if (timeLeft > 10) score = 40;
      else score = 20;

      player.score += score;
      room.gameState.playersGuessedCorrectly.push(player.username);

      io.to(roomCode).emit("CorrectGuess", {
        username: player.username,
        message,
        score,
      });

      const nonDrawers = room.players.filter(
        (p) => p.username !== room.players[room.gameState.drawerIndex].username,
      );

      const allGuessed = nonDrawers.every((p) =>
        room.gameState.playersGuessedCorrectly.includes(p.username),
      );

      if (allGuessed) {
        clearTimeout(room.gameState.timer);
        setTimeout(() => {
          advanceTurn(io, roomCode);
        }, 2000);
      } else {
        io.to(roomCode).emit("ChatMessage", {
          username: socket.data.username,
          message,
          isCorrect: false,
        });
      }
    } else {
      io.to(roomCode).emit("ChatMessage", {
        username: socket.data.username,
        message,
        isCorrect: false,
      });
    }
  });

  socket.on("user_online", async ({ userId }) => {
    if (!userId) return;
    socket.data.userId = userId;
    try {
      await User.findByIdAndUpdate(userId, { status: "online" });
      // Notify all friends
      const user = await User.findById(userId).populate("friends", "_id");
      if (user && user.friends) {
        user.friends.forEach((friend) => {
          io.to(friend._id.toString()).emit("friend_status_update", {
            userId,
            status: "online",
          });
        });
      }
      // Join a personal room for this user for direct events
      socket.join(userId);
      // Store username for message handling
      socket.data.username = user.username;
    } catch {}
  });

  socket.on("user_offline", async ({ userId }) => {
    if (!userId) return;
    try {
      await User.findByIdAndUpdate(userId, { status: "offline" });
      // Notify all friends
      const user = await User.findById(userId).populate("friends", "_id");
      if (user && user.friends) {
        user.friends.forEach((friend) => {
          io.to(friend._id.toString()).emit("friend_status_update", {
            userId,
            status: "offline",
          });
        });
      }
    } catch {}
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { status: "offline" });
        // Notify all friends
        const user = await User.findById(userId).populate("friends", "_id");
        if (user && user.friends) {
          user.friends.forEach((friend) => {
            io.to(friend._id.toString()).emit("friend_status_update", {
              userId,
              status: "offline",
            });
          });
        }
      } catch {}
    }
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
          const players = room.players.map((p) => ({
            username: p.username,
          }));
          io.to(roomCode).emit(
            "PlayerJoined",
            room.players.map((p) => ({
              id: p.socketId,
              name: p.username,
              score: p.score || 0,
              isConnected: true,
              isDrawing: p.isDrawing || false,
            })),
          );
        }

        break;
      }
    }
  });

  // Add playAgainVotes to each room
  socket.on("playAgain", ({ roomCode }) => {
    const room = guestRooms[roomCode];
    if (!room) return;
    if (!room.playAgainVotes) room.playAgainVotes = [];
    const username = socket.data.username;
    if (!room.playAgainVotes.includes(username)) {
      room.playAgainVotes.push(username);
    }
    io.to(roomCode).emit("playAgainVote", {
      votes: room.playAgainVotes.length,
      total: room.players.length,
    });
    // If all players have voted, reset game state and send everyone to lobby
    if (room.playAgainVotes.length === room.players.length) {
      // Reset game state (or you can start a new game here)
      room.gameState = {
        isActive: false,
        currentRound: 0,
        drawerIndex: 0,
        currentWord: null,
        timer: null,
        totalTurns: 0,
      };
      room.playAgainVotes = [];
      // Optionally, reset scores or keep them
      // room.players.forEach(p => p.score = 0);
      io.to(roomCode).emit("playAgainVote", {
        votes: room.players.length,
        total: room.players.length,
      });
      // You can also emit a custom event to tell frontend to go to lobby
    }
  });

  // Direct messaging between friends
  socket.on("sendDirectMessage", async ({ recipientId, message }) => {
    if (!recipientId || !message) return;
    try {
      // Get sender's username from socket data or user object
      let senderUsername = socket.data.username;
      if (!senderUsername && socket.data.userId) {
        const user = await User.findById(socket.data.userId);
        senderUsername = user?.username || "Unknown";
      }

      // For now, just emit the message to the recipient
      // In a full implementation, you'd store this in a database
      io.to(recipientId).emit("chatMessage", {
        id: Date.now().toString(),
        username: senderUsername,
        message: message.message,
        timestamp: new Date(),
        type: "direct",
        recipient: message.recipient,
      });
    } catch (error) {
      console.error("Error sending direct message:", error);
    }
  });

  // Lobby chat messages
  socket.on("sendChatMessage", async ({ roomCode, message }) => {
    if (!roomCode || !message) return;
    try {
      // Get sender's username from socket data or user object
      let senderUsername = socket.data.username;
      if (!senderUsername && socket.data.userId) {
        const user = await User.findById(socket.data.userId);
        senderUsername = user?.username || "Unknown";
      }

      // Broadcast to all users in the room
      io.to(roomCode).emit("chatMessage", {
        id: Date.now().toString(),
        username: senderUsername,
        message: message.message,
        timestamp: new Date(),
        type: "message",
      });
    } catch (error) {
      console.error("Error sending chat message:", error);
    }
  });
};

function startNextTurn(io, roomCode) {
  console.log(`[startNextTurn] Starting next turn for room: ${roomCode}`);
  const room = guestRooms[roomCode];
  const { players, gameState } = room;
  console.log(`[startNextTurn] room: ${roomCode}`);

  if (gameState.currentRound > room.settings.totalRounds) {
    io.to(roomCode).emit("GameOver", {
      message: "Game Over!",
      players: players.map((p) => ({ username: p.username, score: p.score })),
    });

    gameState.isActive = false;
    return;
  }

  const drawer = players[gameState.drawerIndex];
  console.log(
    `[startNextTurn] Drawer: ${drawer.username} (${drawer.socketId})`,
  );
  const word = getRandomWord();
  console.log(`[startNextTurn] Word selected: ${word}`);
  gameState.currentWord = word;

  gameState.playersGuessedCorrectly = [];
  gameState.roundStartTime = Date.now();
  console.log(`[startNextTurn] Emitting WordToDraw to: ${drawer.socketId}`);

  io.to(roomCode).emit("clearCanvas");

  io.to(roomCode).emit("NewTurn", {
    drawer: drawer.username,
    maskedWord: maskWord(gameState.currentWord),
    round: gameState.currentRound,
    totalRounds: room.settings.totalRounds,
    time: room.settings.roundDuration,
  });
  setTimeout(() => {
    io.to(drawer.socketId).emit("WordToDraw", word);
  }, 100);

  console.log(`[startNextTurn] Emitting NewTurn to room: ${roomCode}`);

  gameState.timer = setTimeout(() => {
    advanceTurn(io, roomCode);
  }, room.settings.roundDuration * 1000);
}

// function advanceTurn(io, roomCode) {
//   const room = guestRooms[roomCode];
//   if (!room) return;

//   const gamestate = room.gameState;
//   const numPlayers = room.players.length;

//   gamestate.drawerIndex = (gamestate.drawerIndex + 1) % numPlayers;

//   // if (gamestate.drawerIndex === 0) {
//   //   gamestate.currentRound++;
//   // }

//   // if (gamestate.currentRound > room.settings.totalRounds) {
//   //   io.to(roomCode).emit("GameOver", {
//   //     message: "Game Over!",
//   //     players: room.players.map((p) => ({
//   //       username: p.username,
//   //       score: p.score,
//   //     })),
//   //   });
//   //   gamestate.isActive = false;
//   //   return;
//   // }

//   gamestate.totalTurns++;

//   const totalDrawerTurnsAllowed =
//     room.settings.totalRounds * room.players.length;

//   if (gamestate.totalTurns >= totalDrawerTurnsAllowed) {
//     io.to(roomCode).emit("GameOver", {
//       message: "Game Over!",
//       players: room.players.map((p) => ({
//         username: p.username,
//         score: p.score,
//       })),
//     });
//     gamestate.isActive = false;
//     return;
//   }

//   gamestate.drawerIndex = (gamestate.drawerIndex + 1) % room.players.length;
//   if (gamestate.drawerIndex === 0) {
//     gamestate.currentRound++;
//   }
//   startNextTurn(io, roomCode);
// }

function advanceTurn(io, roomCode) {
  const room = guestRooms[roomCode];
  if (!room) return;

  const gamestate = room.gameState;
  const numPlayers = room.players.length;

  // ⬇️ Increment turn count (used for game over check)
  gamestate.totalTurns++;

  const totalDrawerTurnsAllowed = room.settings.totalRounds * numPlayers;

  // 🛑 Game over after all turns
  if (gamestate.totalTurns >= totalDrawerTurnsAllowed) {
    io.to(roomCode).emit("GameOver", {
      message: "Game Over!",
      players: room.players.map((p) => ({
        username: p.username,
        score: p.score,
      })),
    });
    gamestate.isActive = false;
    return;
  }

  // ✅ Advance drawer correctly
  gamestate.drawerIndex = (gamestate.drawerIndex + 1) % numPlayers;

  // ✅ If we've cycled back to first player, it's a new round
  if (gamestate.drawerIndex === 0) {
    gamestate.currentRound++;
  }

  startNextTurn(io, roomCode);
}

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function maskWord(word) {
  return word.replace(/[a-zA-Z]/g, "_");
}
