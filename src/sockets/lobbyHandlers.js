import { User } from "../models/UserSchema.js";
import {
  calculateGameXPAwards,
  updateUserStatsWithXP,
  didUserLevelUp,
  getLevelUpMessage,
} from "../utils/xpSystem.js";

const guestRooms = {};
const userSocketMap = new Map(); // Map userId to socketId
const socketToUserMap = new Map(); // Map socketId to userId for authenticated users
const usernameToUserIdMap = new Map(); // Map username to userId for authenticated users
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
  // Track user online status
  socket.on("user_online", ({ userId }) => {
    userSocketMap.set(userId, socket.id);
  });

  socket.on("user_offline", ({ userId }) => {
    userSocketMap.delete(userId);
  });

  socket.on("checkRoomExists", ({ roomCode }) => {
    const room = guestRooms[roomCode];
    const exists = !!room;
    io.to(socket.id).emit("roomExists", { roomCode, exists });
  });

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

    console.log(
      `[join_lobby] ${username} joined room ${roomCode}. Host: ${room.host}`,
    );
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

  socket.on(
    "inviteFriend",
    ({ friendId, friendUsername, roomCode, roomName, inviterUsername }) => {
      // Get the friend's socket ID
      const friendSocketId = userSocketMap.get(friendId);

      if (friendSocketId) {
        // Send invitation directly to the friend
        io.to(friendSocketId).emit("friendInvited", {
          friendId,
          friendUsername,
          roomCode,
          roomName,
          inviterUsername,
          timestamp: Date.now(),
        });
      } else {
        // Friend is offline, could store invitation in database for later
        console.log(
          `Friend ${friendUsername} is offline, invitation stored for later`,
        );
      }
    },
  );

  socket.on("acceptInvitation", ({ invitationId, roomCode, username }) => {
    // Join the room
    socket.join(roomCode);
    socket.data.username = username;

    const room = guestRooms[roomCode];
    if (!room) return;

    if (!room.players.some((p) => p.username === username)) {
      room.players.push({ socketId: socket.id, username, score: 0 });
    } else {
      room.players = room.players.map((p) =>
        p.username === username
          ? { ...p, socketId: socket.id, score: p.score || 0 }
          : p,
      );
    }

    // Notify all players in the room
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

    // Send host assignment and settings to the new player
    io.to(socket.id).emit("HostAssigned", { host: room.host });
    io.to(socket.id).emit("lobbySettingsUpdated", room.settings);

    console.log(
      `[acceptInvitation] ${username} accepted invitation to room ${roomCode}. Host: ${room.host}`,
    );
  });

  socket.on("declineInvitation", ({ invitationId, roomCode, username }) => {
    // Just log the decline for now
    console.log(`User ${username} declined invitation to room ${roomCode}`);
  });

  socket.on("leave_lobby", ({ roomCode, username }) => {
    const room = guestRooms[roomCode];
    if (!room) return;

    // Remove player from room
    room.players = room.players.filter((p) => p.username !== username);

    // Leave the socket room
    socket.leave(roomCode);

    // If no players left, delete the room
    if (room.players.length === 0) {
      delete guestRooms[roomCode];
    } else {
      // If host left, assign new host
      if (room.host === username) {
        room.host = room.players[0].username;
        io.to(roomCode).emit("HostAssigned", { host: room.host });
      }

      // Notify remaining players
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

    // Initialize game state properly
    room.gameState = {
      isActive: true,
      currentRound: 1,
      drawerIndex: 0,
      currentWord: null,
      timer: null,
      totalTurns: 0,
      playersGuessedCorrectly: [],
      roundStartTime: null,
    };
    room.joinedPlayers = [];
    room._gameStarted = false;

    console.log(`[startGame] Game state initialized:`, {
      isActive: room.gameState.isActive,
      currentRound: room.gameState.currentRound,
      totalRounds: room.settings.totalRounds,
      players: room.players.length,
    });

    io.to(roomCode).emit("GameStarted", {
      message: "Game has started",
    });
  });

  socket.on("joinGameRoom", async ({ roomCode, username }) => {
    console.log(
      `[joinGameRoom] ${username} (${socket.id}) joined game room: ${roomCode}`,
    );
    socket.join(roomCode);
    socket.data.username = username;

    const room = guestRooms[roomCode];
    if (!room) {
      console.log(`[joinGameRoom] Room ${roomCode} not found!`);
      return;
    }

    // Update player's socket ID if they reconnected during an active game
    const playerIndex = room.players.findIndex((p) => p.username === username);
    if (playerIndex !== -1) {
      room.players[playerIndex].socketId = socket.id;
      console.log(
        `[joinGameRoom] Updated socket ID for ${username} to ${socket.id}`,
      );
    }

    if (!room.joinedPlayers.includes(username)) {
      room.joinedPlayers.push(username);
    }

    console.log(`[joinGameRoom] Room state:`, {
      joinedPlayers: room.joinedPlayers,
      totalPlayers: room.players.length,
      allJoined: room.joinedPlayers.length === room.players.length,
      gameStarted: room._gameStarted,
      isActive: room.gameState?.isActive,
    });

    const allJoined = room.joinedPlayers.length === room.players.length;

    if (allJoined && !room._gameStarted) {
      room._gameStarted = true;
      console.log(
        `[joinGameRoom] All players joined. Starting game for room: ${roomCode}`,
      );
      await startNextTurn(io, roomCode);
    } else if (room.gameState && room.gameState.isActive) {
      // Game is already active, sync the new/reconnecting player
      console.log(`[joinGameRoom] Syncing player ${username} to active game`);
      
      const now = Date.now();
      // Calculate remaining time
      let timeLeft = room.settings.roundDuration;
      if (room.gameState.roundStartTime) {
        const timeElapsed = (now - room.gameState.roundStartTime) / 1000;
        timeLeft = Math.max(0, Math.ceil(room.settings.roundDuration - timeElapsed));
      }
      
      const currentDrawer = room.players[room.gameState.drawerIndex];

      // Emit State Sync
      io.to(socket.id).emit("NewTurn", {
        drawer: currentDrawer.username,
        maskedWord: maskWord(room.gameState.currentWord),
        round: room.gameState.currentRound,
        totalRounds: room.settings.totalRounds,
        time: timeLeft,
      });

      // If this player is the drawer, send the word
      if (username === currentDrawer.username) {
        io.to(socket.id).emit("WordToDraw", room.gameState.currentWord);
      }
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

    // Check if the sender is the current drawer
    const currentDrawer = room.players[room.gameState.drawerIndex];
    if (currentDrawer && player.username === currentDrawer.username) {
      // Drawer cannot guess their own word
      return;
    }

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

      // Track words guessed correctly for XP
      if (!player.wordsGuessedCorrectly) {
        player.wordsGuessedCorrectly = 0;
      }
      player.wordsGuessedCorrectly++;

      // Track words drawn successfully for the current drawer
      const currentDrawer = room.players[room.gameState.drawerIndex];
      if (currentDrawer && !currentDrawer.wordsDrawnSuccessfully) {
        currentDrawer.wordsDrawnSuccessfully = 0;
      }
      if (currentDrawer) {
        currentDrawer.wordsDrawnSuccessfully++;
      }

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
        setTimeout(async () => {
          await advanceTurn(io, roomCode);
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
    socketToUserMap.set(socket.id, userId); // Track authenticated users
    try {
      await User.findByIdAndUpdate(userId, { status: "online" });
      // Notify all friends
      const user = await User.findById(userId).populate("friends", "_id");
      if (user && user.friends) {
        console.log(
          `[user_online] User ${user.username} (${userId}) is online. Notifying ${user.friends.length} friends.`,
        );
        user.friends.forEach((friend) => {
          io.to(friend._id.toString()).emit("friend_status_update", {
            userId,
            status: "online",
          });
        });
      }
      // Join a personal room for this user for direct events
      socket.join(userId);
      // Store username for message handling and stats tracking
      if (user) {
        socket.data.username = user.username;
        usernameToUserIdMap.set(user.username, userId); // Track username to userId mapping
      }
    } catch (error) {
      console.error("Error in user_online handler:", error);
    }
  });

  socket.on("user_offline", async ({ userId }) => {
    if (!userId) return;
    try {
      await User.findByIdAndUpdate(userId, { status: "offline" });
      // Notify all friends
      const user = await User.findById(userId).populate("friends", "_id");
      if (user && user.friends) {
        console.log(
          `[user_offline] User ${user.username} (${userId}) is offline. Notifying ${user.friends.length} friends.`,
        );
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
    const username = socket.data.username;

    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { status: "offline" });
        // Notify all friends
        const user = await User.findById(userId).populate("friends", "_id");
        if (user && user.friends) {
          console.log(
            `[disconnect] User ${user.username} (${userId}) disconnected. Notifying ${user.friends.length} friends.`,
          );
          user.friends.forEach((friend) => {
            io.to(friend._id.toString()).emit("friend_status_update", {
              userId,
              status: "offline",
            });
          });
        }
      } catch {}
    }

    // Clean up socket mappings
    socketToUserMap.delete(socket.id);
    userSocketMap.delete(userId);
    if (username) {
      usernameToUserIdMap.delete(username);
    }

    for (const roomCode in guestRooms) {
      const room = guestRooms[roomCode];
      const index = room.players.findIndex((p) => p.socketId === socket.id);
      if (index !== -1) {
        const [disconnected] = room.players.splice(index, 1);

        // Don't remove players or delete room if game is active
        if (room.gameState && room.gameState.isActive) {
          console.log(
            `[disconnect] Player ${disconnected.username} disconnected during active game in room ${roomCode}. Keeping room alive.`,
          );
          // Just update the socket ID to null to indicate disconnected but keep player in room
          room.players.push({ ...disconnected, socketId: null });
        } else {
          // Normal lobby disconnect logic
          if (disconnected.username === room.host && room.players.length > 0) {
            room.host = room.players[0].username;
            io.to(roomCode).emit("HostAssigned", { host: room.host });
          }

          if (room.players.length === 0) {
            delete guestRooms[roomCode];
          } else {
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

async function startNextTurn(io, roomCode) {
  console.log(`[startNextTurn] Starting next turn for room: ${roomCode}`);
  const room = guestRooms[roomCode];
  if (!room) {
    console.log(`[startNextTurn] Room ${roomCode} not found!`);
    return;
  }

  const { players, gameState } = room;
  console.log(`[startNextTurn] Game state:`, {
    isActive: gameState.isActive,
    currentRound: gameState.currentRound,
    totalRounds: room.settings.totalRounds,
    players: players.length,
    drawerIndex: gameState.drawerIndex,
  });

  // Check if game should end (currentRound exceeds totalRounds)
  if (gameState.currentRound > room.settings.totalRounds) {
    console.log(
      `[startNextTurn] Game over - currentRound (${gameState.currentRound}) > totalRounds (${room.settings.totalRounds})`,
    );
    // Update stats for authenticated users before emitting GameOver
    await updateUserStats(players, roomCode, io);

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

  gameState.timer = setTimeout(async () => {
    await advanceTurn(io, roomCode);
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

async function advanceTurn(io, roomCode) {
  const room = guestRooms[roomCode];
  if (!room) return;

  const gamestate = room.gameState;
  const numPlayers = room.players.length;

  // ⬇️ Increment turn count (used for game over check)
  gamestate.totalTurns++;

  const totalDrawerTurnsAllowed = room.settings.totalRounds * numPlayers;

  // 🛑 Game over after all turns
  if (gamestate.totalTurns >= totalDrawerTurnsAllowed) {
    // Update stats for authenticated users before emitting GameOver
    await updateUserStats(room.players, roomCode, io);

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

// Function to update user stats when game ends
async function updateUserStats(players, roomCode, io) {
  try {
    // Find the winner (player with highest score)
    const sortedPlayers = players.sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const winnerScore = winner.score;

    console.log(`[updateUserStats] Updating stats for room ${roomCode}`);
    console.log(
      `[updateUserStats] Players:`,
      players.map((p) => ({ username: p.username, score: p.score })),
    );
    console.log(
      `[updateUserStats] Winner: ${winner.username} with score ${winnerScore}`,
    );

    // Get room data for XP calculations
    const room = guestRooms[roomCode];
    const totalWordsInGame = room?.settings?.totalRounds || 3;

    // Update stats for all authenticated users in the game
    for (const player of players) {
      // Use username to find userId instead of socket ID
      const userId = usernameToUserIdMap.get(player.username);
      if (userId) {
        // This is an authenticated user, update their stats
        const user = await User.findById(userId);
        if (user) {
          const isWinner =
            player.username === winner.username && player.score === winnerScore;

          // Calculate XP for this player
          console.log(`[Stats] Player data for XP calculation:`, {
            username: player.username,
            wordsGuessedCorrectly: player.wordsGuessedCorrectly || 0,
            wordsDrawnSuccessfully: player.wordsDrawnSuccessfully || 0,
            score: player.score,
            totalWordsInGame,
            isWinner,
          });

          const gameData = {
            isWinner,
            wordsGuessedCorrectly: player.wordsGuessedCorrectly || 0,
            wordsDrawnSuccessfully: player.wordsDrawnSuccessfully || 0,
            isPerfectGame: player.score >= totalWordsInGame * 100, // Assuming 100 points per word
            winStreak: user.stats?.winStreak || 0,
            totalWordsInGame,
          };

          const xpEarned = calculateGameXPAwards(gameData);
          console.log(`[Stats] XP calculation for ${player.username}:`, {
            gameData,
            xpEarned,
          });
          const oldLevel = user.stats?.level || 1;

          // Update stats with XP system
          const updatedStats = updateUserStatsWithXP(
            user.stats || {},
            xpEarned,
          );

          // Add traditional stats
          updatedStats.gamesplayed = (user.stats?.gamesplayed || 0) + 1;
          updatedStats.gamesWon =
            (user.stats?.gamesWon || 0) + (isWinner ? 1 : 0);

          // Calculate win rate
          if (updatedStats.gamesplayed > 0) {
            updatedStats.winRate = Math.round(
              (updatedStats.gamesWon / updatedStats.gamesplayed) * 100,
            );
          }

          // Update win streak
          if (isWinner) {
            updatedStats.winStreak = (user.stats?.winStreak || 0) + 1;
          } else {
            updatedStats.winStreak = 0;
          }

          // Create a clean stats object without Mongoose properties
          const cleanStats = {
            gamesplayed: updatedStats.gamesplayed,
            gamesWon: updatedStats.gamesWon,
            level: updatedStats.level,
            winRate: updatedStats.winRate,
            xp: updatedStats.xp,
            currentXP: updatedStats.currentXP,
            xpToNextLevel: updatedStats.xpToNextLevel,
            winStreak: updatedStats.winStreak,
          };

          // Update user in database
          console.log(
            `[Stats] Saving to database for ${user.username}:`,
            cleanStats,
          );
          const result = await User.findByIdAndUpdate(
            userId,
            {
              stats: cleanStats,
            },
            { new: true },
          );
          console.log(
            `[Stats] Database update result for ${user.username}:`,
            result.stats,
          );

          // Check if user leveled up
          const leveledUp = didUserLevelUp(oldLevel, updatedStats.level);
          const levelUpMessage = getLevelUpMessage(
            oldLevel,
            updatedStats.level,
          );

          // Notify the user that their stats have been updated
          const userSocketId = userSocketMap.get(userId);
          if (userSocketId) {
            console.log(
              `[Stats] Emitting statsUpdated to user ${userId} (${user.username}) via socket ${userSocketId}`,
            );
            io.to(userSocketId).emit("statsUpdated", {
              stats: updatedStats,
              xpEarned,
              leveledUp,
              levelUpMessage,
            });
            console.log(`[Stats] statsUpdated event emitted successfully`);
          } else {
            console.log(
              `[Stats] User ${userId} (${user.username}) is not connected, cannot emit statsUpdated`,
            );
          }

          console.log(`[Stats] Updated stats for ${user.username}:`, {
            gamesPlayed: updatedStats.gamesplayed,
            gamesWon: updatedStats.gamesWon,
            winRate: updatedStats.winRate,
            level: updatedStats.level,
            xp: updatedStats.xp,
            currentXP: updatedStats.currentXP,
            xpToNextLevel: updatedStats.xpToNextLevel,
            xpEarned,
            leveledUp,
            isWinner,
          });
        }
      } else {
        console.log(
          `[updateUserStats] Player ${player.username} is not an authenticated user, skipping stats update`,
        );
      }
    }
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
}

function maskWord(word) {
  return word.replace(/[a-zA-Z]/g, "_");
}
