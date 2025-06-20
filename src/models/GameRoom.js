import mongoose from "mongoose";

const gameRoomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: String,
        score: { type: Number, default: 0 },
        isHost: { type: Boolean, default: false },
      },
    ],
    currentWord: { type: String },
    drawerIndex: { type: Number, default: 0 },
    round: { type: Number, default: 1 },
    totalRounds: { type: Number, default: 5 },
    isGameStarted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const GameRoom = mongoose.model("GameRoom", gameRoomSchema);
