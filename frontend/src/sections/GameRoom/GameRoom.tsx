import React, { useState, useCallback, useEffect, useRef } from "react";
import { GameHeader } from "./GameHeader";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
import { ChatBox } from "./ChatBox";
import { PlayerList } from "./PlayerList";
import type { Player, ChatMessage, GameState } from "../../types/game";
import socket from "../../sockets/socket";
import { gsap } from "gsap";
import { useLocation } from "react-router-dom";

export const GameRoom: React.FC = () => {
  const location = useLocation();
  const { players: iniTialUsernames, settings, host } = location.state;
  const [players, setPlayers] = useState<Player[]>(iniTialUsernames);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    currentRound: 0,
    maxRounds: 0,
    timeLeft: 0,
    currentWord: undefined,
    currentDrawer: undefined,
    gamePhase: "waiting",
  });

  const [currentTool, setCurrentTool] = useState<"pencil" | "eraser">("pencil");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);

  const gameRoomRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentPlayerName = localStorage.getItem("guestUsername") || "Guest";
  const roomCode = localStorage.getItem("roomCode") || "";
  const isCurrentPlayerDrawing = gameState.currentDrawer === currentPlayerName;

  // Debug game state changes
  useEffect(() => {
    console.log("[GameState] Updated:", {
      isActive: gameState.isActive,
      currentRound: gameState.currentRound,
      timeLeft: gameState.timeLeft,
      currentWord: gameState.currentWord,
      currentDrawer: gameState.currentDrawer,
      gamePhase: gameState.gamePhase,
      isCurrentPlayerDrawing,
    });
  }, [gameState, isCurrentPlayerDrawing]);

  useEffect(() => {
    if (gameRoomRef.current) {
      gsap.fromTo(
        gameRoomRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
      );
    }
  }, []);

  // Auto-start game when entering GameRoom
  useEffect(() => {
    console.log("[GameRoom] Component mounted, attempting to join game room");
    console.log("[GameRoom] Room code:", roomCode);
    console.log("[GameRoom] Current player:", currentPlayerName);

    // Emit joinGameRoom to join the game room
    if (roomCode) {
      console.log("[GameRoom] Emitting joinGameRoom event");
      socket.emit("joinGameRoom", { roomCode, username: currentPlayerName });
    }
  }, [roomCode, currentPlayerName]);

  // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  useEffect(() => {
    if (gridRef.current) {
      const gridItems = gridRef.current.children;
      gsap.fromTo(
        gridItems,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 0.5,
        },
      );
    }
  }, []);

  useEffect(() => {
    if (gameState.timeLeft > 0 && gameState.gamePhase === "drawing") {
      console.log(
        "[Timer] Starting countdown with timeLeft:",
        gameState.timeLeft,
      );
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0 && gameState.gamePhase === "drawing") {
      console.log("[Timer] Time's up!");
    }
  }, [gameState.timeLeft, gameState.gamePhase]);

  const handleSendMessage = useCallback(
    (message: string) => {
      if (!roomCode) return;

      // Add message to local chat immediately
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          playerId: currentPlayerName,
          playerName: currentPlayerName,
          message,
          timestamp: Date.now(),
          isSystemMessage: false,
        },
      ]);

      socket.emit("sendGuess", { roomCode, message });
    },
    [roomCode, currentPlayerName],
  );

  useEffect(() => {
    socket.on("GameStarted", ({ message }) => {
      console.log("[GameStarted] received:", message);
      setGameState((prev) => ({
        ...prev,
        isActive: true,
        gamePhase: "waiting",
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          playerId: "system",
          playerName: "System",
          message: "🎮 Game started! The first drawer will be selected...",
          timestamp: Date.now(),
          isSystemMessage: true,
        },
      ]);
    });

    socket.on("GameState", (data) => {
      console.log("[GameState] received:", data);
      setGameState((prev) => ({
        ...prev,
        isActive: data.isActive,
        currentRound: data.currentRound,
        maxRounds: data.maxRounds,
        timeLeft: data.timeLeft,
        currentWord: data.currentWord || undefined,
        currentDrawer: data.currentDrawer || undefined,
        gamePhase: data.gamePhase as "waiting" | "drawing",
      }));
    });

    socket.on("NewTurn", (data) => {
      console.log("[NewTurn] received:", data);
      console.log("[NewTurn] Current player:", currentPlayerName);
      console.log("[NewTurn] Drawer:", data.drawer);
      console.log(
        "[NewTurn] Is current player drawing:",
        data.drawer === currentPlayerName,
      );
      console.log(
        "[NewTurn] time value:",
        data.time,
        "type:",
        typeof data.time,
      );
      setGameState((prev) => ({
        ...prev,
        currentDrawer: data.drawer,
        currentWord: undefined,
        currentRound: data.round,
        maxRounds: data.totalRounds,
        gamePhase: "drawing",
        timeLeft: data.time,
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          playerId: "system",
          playerName: "System",
          message: `${data.drawer} is now drawing.`,
          timestamp: Date.now(),
          isSystemMessage: true,
        },
      ]);
    });

    socket.on("drawing", ({ imageData }: { imageData: string }) => {
      console.log("[Drawing received] imageData length:", imageData.length);
      const canvas = canvasRef.current;
      if (canvas && !isCurrentPlayerDrawing) {
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = imageData;
      }
    });

    socket.on("WordToDraw", (word) => {
      console.log("[WordToDraw] received:", word);
      console.log("[WordToDraw] Current player:", currentPlayerName);
      console.log(
        "[WordToDraw] Is current player drawing:",
        isCurrentPlayerDrawing,
      );
      setGameState((prev) => ({
        ...prev,
        currentWord: word,
      }));
    });

    socket.on("CorrectGuess", ({ username, message }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          playerId: "system",
          playerName: "System",
          message: `🎉 ${username} guessed it! "${message}"`,
          timestamp: Date.now(),
          isSystemMessage: true,
          isCorrectGuess: true,
        },
      ]);
    });

    socket.on("ChatMessage", ({ username, message }) => {
      // Don't add duplicate messages (since we already add local messages)
      if (username !== currentPlayerName) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            playerId: username,
            playerName: username,
            message,
            timestamp: Date.now(),
            isSystemMessage: false,
          },
        ]);
      }
    });

    socket.on("GameOver", ({ players }) => {
      const leaderboard = players
        .sort((a, b) => b.score - a.score)
        .map((p, i) => `${i + 1}. ${p.username} - ${p.score} pts`)
        .join("\n");

      alert("🎉 Game Over!\n\n" + leaderboard);
    });

    return () => {
      socket.off("GameStarted");
      socket.off("GameState");
      socket.off("NewTurn");
      socket.off("drawing");
      socket.off("WordToDraw");
      socket.off("CorrectGuess");
      socket.off("ChatMessage");
      socket.off("GameOver");
    };
  }, []);

  const handleDrawingChange = useCallback(
    (imageData: string) => {
      if (isCurrentPlayerDrawing && roomCode) {
        console.log("[Drawing emit] Sending drawing update.");
        socket.emit("drawing", { roomCode, imageData });
      }
    },
    [isCurrentPlayerDrawing, roomCode],
  );

  return (
    <div
      ref={gameRoomRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4"
    >
      <div className="max-w-7xl mx-auto">
        <GameHeader
          gameState={gameState}
          playerCount={players.length}
          isCurrentPlayerDrawing={isCurrentPlayerDrawing}
        />

        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]"
        >
          {/* Left Column - Players */}
          <div className="lg:col-span-1">
            <PlayerList
              players={players}
              currentDrawerId={gameState.currentDrawer}
            />
          </div>

          {/* Center Column - Canvas and Tools */}
          <div className="lg:col-span-2 space-y-4">
            <DrawingCanvas
              isDrawing={isCurrentPlayerDrawing}
              currentTool={currentTool}
              currentColor={currentColor}
              brushSize={brushSize}
              onDrawingChange={handleDrawingChange}
              canvasRef={canvasRef}
            />

            <DrawingToolbar
              currentTool={currentTool}
              currentColor={currentColor}
              brushSize={brushSize}
              isDrawing={isCurrentPlayerDrawing}
              onToolChange={setCurrentTool}
              onColorChange={setCurrentColor}
              onBrushSizeChange={setBrushSize}
            />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              currentPlayerName={currentPlayerName}
              isCurrentPlayerDrawing={isCurrentPlayerDrawing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
