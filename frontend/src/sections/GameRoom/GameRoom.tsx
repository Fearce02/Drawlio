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
  
  // Helper to find player avatar
  const getPlayerAvatar = (username: string) => {
      const player = players.find(p => p.name === username);
      return player?.avatar;
  };

  const handleSendMessage = useCallback(
    (message: string) => {
      if (!roomCode) return;

      // Add message to local chat immediately
      const myAvatar = getPlayerAvatar(currentPlayerName);
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          playerId: currentPlayerName,
          playerName: currentPlayerName,
          message,
          timestamp: Date.now(),
          isSystemMessage: false,
          avatar: myAvatar,
        },
      ]);

      socket.emit("sendGuess", { roomCode, message });
    },
    [roomCode, currentPlayerName, players],
  );

  useEffect(() => {
    const handleGameStarted = (data: any) => {
         setGameState((prev) => ({ ...prev, isActive: true, gamePhase: "waiting" }));
    };

    const handleNewTurn = (data: any) => {
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
    };

    const handleWordToDraw = (word: string) => {
      setGameState((prev) => ({
        ...prev,
        currentWord: word,
        gamePhase: "drawing",
      }));
    };

    const handleCorrectGuess = ({ username, message }: any) => {
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
    };

    const handleChatMessage = ({ username, message }: any) => {
      // Don't add duplicate messages (since we already add local messages)
      if (username !== currentPlayerName) {
        const avatar = getPlayerAvatar(username);
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            playerId: username,
            playerName: username,
            message,
            timestamp: Date.now(),
            isSystemMessage: false,
            avatar,
          },
        ]);
      }
    };

    const handleGameOver = ({ players }: any) => {
      // Map backend player objects to frontend Player type
      const mappedPlayers = players.map((p: any, i: number) => ({
        id: p.id || p.socketId || p.username || `player-${i}`,
        name: p.name || p.username,
        score: p.score ?? 0,
        isDrawing: p.isDrawing ?? false,
        isConnected: p.isConnected ?? true,
        avatar: p.avatar,
      }));
      setFinalPlayers(mappedPlayers);
      setGameState((prev) => ({
        ...prev,
        gamePhase: "finished",
      }));
    };

    const handlePlayAgainVote = (data: { votes: number; total: number }) => {
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
    };

    socket.on("GameStarted", handleGameStarted);
    socket.on("NewTurn", handleNewTurn);
    socket.on("WordToDraw", handleWordToDraw);
    socket.on("CorrectGuess", handleCorrectGuess);
    socket.on("ChatMessage", handleChatMessage);
    socket.on("GameOver", handleGameOver);
    socket.on("playAgainVote", handlePlayAgainVote);

    return () => {
      socket.off("GameStarted", handleGameStarted);
      socket.off("NewTurn", handleNewTurn);
      socket.off("WordToDraw", handleWordToDraw);
      socket.off("CorrectGuess", handleCorrectGuess);
      socket.off("ChatMessage", handleChatMessage);
      socket.off("GameOver", handleGameOver);
      socket.off("playAgainVote", handlePlayAgainVote);
    };
  }, [players, navigate, currentPlayerName, isGuest]); // Added players to dep array so getPlayerAvatar works

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
          avatar: p.avatar,
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
      className="min-h-screen bg-[#FDF8FC] relative p-4 overflow-hidden"
    >
        {/* Background Orbs */}
       <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#D0BCFF] opacity-20 blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EFB8C8] opacity-20 blur-[80px]" />
      </div>

      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        <GameHeader
          gameState={gameState}
          playerCount={players.length}
          isCurrentPlayerDrawing={isCurrentPlayerDrawing}
        />

        <div
          ref={gridRef}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0"
        >
          {/* Left Column - Players (2 cols) */}
          <div className="lg:col-span-3 overflow-hidden">
            <PlayerList
              players={players}
              currentDrawerId={gameState.currentDrawer}
            />
          </div>

          {/* Center Column - Canvas (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex-1 min-h-[400px] bg-white rounded-[24px] shadow-sm border border-[#CAC4D0] overflow-hidden relative">
                <DrawingCanvas
                isCurrentPlayerDrawing={isCurrentPlayerDrawing}
                currentTool={currentTool}
                currentColor={currentColor}
                brushSize={brushSize}
                roomCode={roomCode}
                />
            </div>
            
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

          {/* Right Column - Chat (4 cols) */}
          <div className="lg:col-span-3 overflow-hidden">
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
