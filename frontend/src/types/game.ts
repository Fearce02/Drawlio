export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawing: boolean;
  isConnected: boolean;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isCorrectGuess?: boolean;
  isSystemMessage?: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  tool: "pencil" | "eraser";
}

export interface GameState {
  isActive: boolean;
  currentRound: number;
  maxRounds: number;
  timeLeft: number;
  currentWord?: string;
  currentDrawer?: string;
  wordChoices?: string[];
  gamePhase: "waiting" | "choosing" | "drawing" | "finished";
}
