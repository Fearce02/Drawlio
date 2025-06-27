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

  const currentPlayerName = localStorage.getItem("guestUsername") || "Guest";
  const roomCode = localStorage.getItem("roomCode") || "";
  const isCurrentPlayerDrawing = gameState.currentDrawer === currentPlayerName;

  useEffect(() => {
    if (gameRoomRef.current) {
      gsap.fromTo(
        gameRoomRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
      );
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
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.timeLeft, gameState.gamePhase]);

  const handleSendMessage = useCallback(
    (message: string) => {
      if (!roomCode) return;
      socket.emit("sendGuess", { roomCode, message });
    },
    [roomCode],
  );

  useEffect(() => {
    socket.on("NewTurn", (data) => {
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

    socket.on("WordToDraw", (word) => {
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

    socket.on("GameOver", ({ players }) => {
      const leaderboard = players
        .sort((a, b) => b.score - a.score)
        .map((p, i) => `${i + 1}. ${p.username} - ${p.score} pts`)
        .join("\n");

      alert("🎉 Game Over!\n\n" + leaderboard);
    });

    return () => {
      socket.off("NewTurn");
      socket.off("WordToDraw");
      socket.off("CorrectGuess");
      socket.off("GameOver");
    };
  }, []);

  const handleDrawingChange = useCallback((imageData: string) => {}, []);

  return (
    <div
      ref={gameRoomRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4"
    >
      <div className="max-w-7xl mx-auto">
        <GameHeader gameState={gameState} playerCount={players.length} />

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

          {isCurrentPlayerDrawing && gameState.currentWord && (
            <div className="mb-4 text-center text-lg font-semibold text-green-600">
              Your word:{" "}
              <span className="font-bold">{gameState.currentWord}</span>
            </div>
          )}

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              currentPlayerName={currentPlayerName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
