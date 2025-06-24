import { io, Socket } from "socket.io-client";

type GuestPlayer = {
  username: string;
};

type ServerToClientEvents = {
  playerJoined: (players: { username: string; isHost: boolean }[]) => void;
  gameStarted: (data: { message: string }) => void;
  guestLobbyUpdate: (data: { players: GuestPlayer[] }) => void;
};

type ClientToServerEvents = {
  joinRoom: (data: { username: string; roomCode: string }) => void;
  startGame: (data: { roomCode: string }) => void;
  joinGuestLobby: (data: { username: string }) => void;
};

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.BACKEND_URL || "http://localhost:8000",
);

export default socket;
