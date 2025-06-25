import mongoose from "mongoose";

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
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
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
    password: {
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
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sentRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
export const UserStats = mongoose.model("UserStats", userStats);
