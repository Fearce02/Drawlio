import mongoose from "mongoose";
import { email } from "zod/v4";

const userStats = new mongoose.Schema({
  gamesplayed: {
    type: Number,
    default: 0,
  },
  gamesWon: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  winRate: {
    type: Number,
    default: 0,
  },
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    HashPassword: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
    },
    stats: {
      type: userStats,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
export const UserStats = mongoose.model("UserStats", userStats);
