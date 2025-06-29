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

  socket.on("drawing", ({ roomCode, imageData }) => {
    io.to(roomCode).emit("drawing", { imageData });
  });

  socket.on("sendGuess", ({ roomCode, message }) => {
    const room = guestRooms[roomCode];
    if (!room || !room.gameState.currentWord) return;

    const isCorrect =
      message.trim().toLowerCase() === room.gameState.currentWord.toLowerCase();
    if (isCorrect) {
      const guesser = room.players.find((p) => p.socketId === socket.id);
      if (guesser) guesser.score += 10;

      io.to(roomCode).emit("CorrectGuess", {
        username: guesser.username,
        message,
      });

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

  console.log(`[startNextTurn] Emitting WordToDraw to: ${drawer.socketId}`);
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

function advanceTurn(io, roomCode) {
  const room = guestRooms[roomCode];
  if (!room) return;

  room.gameState.drawerIndex =
    (room.gameState.drawerIndex + 1) % room.players.length;
  if (room.gameState.drawerIndex === 0) {
    room.gameState.currentRound++;
  }

  startNextTurn(io, roomCode);
}

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function maskWord(word) {
  return word.replace(/[a-zA-Z]/g, "_");
}
