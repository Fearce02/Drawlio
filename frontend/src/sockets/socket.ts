import { io, Socket } from "socket.io-client";

// type GuestPlayer = {
//   username: string;
// };

type ServerToClientEvents = {
  PlayerJoined: (players: { username: string; isHost: boolean }[]) => void;
  guestLobbyUpdate: (data: { players: { username: string }[] }) => void;
  HostAssigned: (data: { host: string }) => void;
  lobbySettingsUpdated: (settings: any) => void;
  GameStarted: (data: {
    message: string;
    drawer: any;
    round: number;
    time: any;
  }) => void;

  NewTurn: (data: {
    drawer: string;
    maskedWord: string;
    round: number;
    totalRounds: number;
    time: number;
  }) => void;

  drawing: (data: { imageData: string }) => void;

  WordToDraw: (word: string) => void;

  CorrectGuess: (data: { username: string; message: string }) => void;

  ChatMessage: (data: { username: string; message: string }) => void;

  GameOver: (data: { players: { username: string; score: number }[] }) => void;

  GameState: (data: {
    isActive: boolean;
    currentRound: number;
    maxRounds: number;
    timeLeft: number;
    currentWord: string | null;
    currentDrawer: string | null;
    gamePhase: string;
  }) => void;
};

type ClientToServerEvents = {
  join_lobby: (data: { username: string; roomCode: string }) => void;
  joinGuestLobby: (data: { username: string }) => void;
  joinGameRoom: (data: { username: string; roomCode: string }) => void;
  startGame: (data: { roomCode: string }) => void;
  updateSettings: (data: { roomCode: string; settings: object }) => void;
  drawing: (data: { roomCode: string; imageData: string }) => void;
  sendGuess: (data: { roomCode: string; message: string }) => void;
};

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.BACKEND_URL || "http://localhost:8000",
  {
    transports: ["websocket"],
  },
);

export default socket;
