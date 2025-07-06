import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { GameHeader } from "./GameHeader";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
import { ChatBox } from "./ChatBox";
import { PlayerList } from "./PlayerList";
import type { Player, ChatMessage, GameState } from "../../types/game";
import socket from "../../sockets/socket";
import { gsap } from "gsap";
import { useLocation, useNavigate } from "react-router-dom";
import { GameOver } from "./GameOver";

export const GameRoom: React.FC = () => {
  const location = useLocation();
  const { players: initialPlayers, settings, host } = location.state || {};
  const [players, setPlayers] = useState<Player[]>(initialPlayers || []);
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

  // Get user info - handle both guest and authenticated users
  const getCurrentUserInfo = () => {
    const guestUsername = localStorage.getItem("guestUsername");
    if (guestUsername) {
      // Guest user
      return {
        username: guestUsername,
        isGuest: true,
        roomCode: localStorage.getItem("roomCode") || "",
      };
    } else {
      // Authenticated user
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          return {
            username:
              user.username ||
              user.email ||
              `${user.firstName} ${user.lastName}`,
            isGuest: false,
            roomCode: location.state?.roomCode || "",
          };
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
    return { username: "Unknown", isGuest: true, roomCode: "" };
  };

  const {
    username: currentPlayerName,
    isGuest,
    roomCode,
  } = getCurrentUserInfo();

  const isCurrentPlayerDrawing = useMemo(() => {
    return gameState.currentDrawer === currentPlayerName;
  }, [gameState.currentDrawer, currentPlayerName]);

  const navigate = useNavigate();
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);
  const [playAgainVotes, setPlayAgainVotes] = useState(0);

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
      currentPlayerName,
      isGuest,
    });
  }, [gameState, isCurrentPlayerDrawing, currentPlayerName, isGuest]);

  useEffect(() => {
    if (gameRoomRef.current) {
      gsap.fromTo(
        gameRoomRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
      );
    }
  }, []);

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color = "black",
    width = 2,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  // Auto-start game when entering GameRoom
  useEffect(() => {
    console.log("[GameRoom] Component mounted, attempting to join game room");
    console.log("[GameRoom] Room code:", roomCode);
    console.log("[GameRoom] Current player:", currentPlayerName);
    console.log("[GameRoom] Is guest:", isGuest);

    if (roomCode) {
      console.log("[GameRoom] Emitting joinGameRoom event");
      socket.emit("joinGameRoom", { roomCode, username: currentPlayerName });
    }
  }, [roomCode, currentPlayerName, isGuest]);

  // Initialize canvas when component mounts
  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (canvas) {
  //     const ctx = canvas.getContext("2d");
  //     if (ctx) {
  //       // Set white background
  //       ctx.fillStyle = "#ffffff";
  //       ctx.fillRect(0, 0, canvas.width, canvas.height);
  //     }
  //   }
  // }, []);

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
    socket.on("GameStarted", (data) => {
      console.log("[GameStarted] received:", data);
      setGameState((prev) => ({
        ...prev,
        isActive: true,
        gamePhase: "waiting",
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

    socket.on("drawing", (data) => {
      console.log("[drawing] received:", data);
      // The DrawingCanvas component handles the drawing events
      // This is just for debugging
    });

    socket.on("clearCanvas", () => {
      console.log("[clearCanvas] received");
      // The DrawingCanvas component handles the clear events
      // This is just for debugging
    });

    socket.on("WordToDraw", (word: string) => {
      console.log("[WordToDraw] received:", word);
      console.log("[WordToDraw] Current player:", currentPlayerName);
      setGameState((prev) => ({
        ...prev,
        currentWord: word,
        gamePhase: "drawing",
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
      // Map backend player objects to frontend Player type
      const mappedPlayers = players.map((p: any, i: number) => ({
        id: p.id || p.socketId || p.username || `player-${i}`,
        name: p.name || p.username,
        score: p.score ?? 0,
        isDrawing: p.isDrawing ?? false,
        isConnected: p.isConnected ?? true,
      }));
      setFinalPlayers(mappedPlayers);
      setGameState((prev) => ({
        ...prev,
        gamePhase: "finished",
      }));
    });

    socket.on("playAgainVote", (data: { votes: number; total: number }) => {
      const { votes, total } = data;
      setPlayAgainVotes(votes);
      // If all players voted, navigate to appropriate lobby
      if (votes === players.length) {
        if (isGuest) {
          navigate("/guest-lobby");
        } else {
          navigate("/friends-lobby");
        }
      }
    });

    return () => {
      socket.off("GameStarted");
      socket.off("NewTurn");
      socket.off("drawing");
      socket.off("clearCanvas");
      socket.off("WordToDraw");
      socket.off("CorrectGuess");
      socket.off("ChatMessage");
      socket.off("GameOver");
      socket.off("playAgainVote");
    };
  }, [players.length, navigate, currentPlayerName, isGuest]);

  const handlePlayAgain = () => {
    socket.emit("playAgain", { roomCode });
    // Optionally show a waiting message/modal until all players vote
  };

  const handleExit = () => {
    if (isGuest) {
      navigate("/");
    } else {
      navigate("/dashboard");
    }
  };

  if (gameState.gamePhase === "finished") {
    return (
      <GameOver
        players={finalPlayers.map((p) => ({
          id: p.id,
          username: p.name, // GameOver expects username
          score: p.score,
          isCurrentPlayer: p.name === currentPlayerName,
        }))}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
        totalRounds={gameState.maxRounds}
        currentPlayerName={currentPlayerName}
      />
    );
  }

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
              isCurrentPlayerDrawing={isCurrentPlayerDrawing}
              currentTool={currentTool}
              currentColor={currentColor}
              brushSize={brushSize}
              roomCode={roomCode}
              // onDrawingChange={handleDrawingChange}
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
          <div className="lg:col-span-1 h-full overflow-hidden">
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
