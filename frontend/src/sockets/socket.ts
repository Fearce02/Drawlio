import { io, Socket } from "socket.io-client";

// type GuestPlayer = {
//   username: string;
// };

type ServerToClientEvents = {
  PlayerJoined: (players: { username: string; isHost: boolean }[]) => void;
  HostAssigned: (data: { host: string }) => void;
  lobbySettingsUpdated: (settings: any) => void;
  GameStarted: (data: { message: string }) => void;
};

type ClientToServerEvents = {
  join_lobby: (data: { username: string; roomCode: string }) => void;
  startGame: (data: { roomCode: string }) => void;
  updateSettings: (data: { roomCode: string; settings: object }) => void;
};

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.BACKEND_URL || "http://localhost:8000",
);

export default socket;
