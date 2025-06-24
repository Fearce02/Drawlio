import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/UserSchema";
import authenticate from "../middlewares/jwtAuth";

const router = express.Router();

router.post("/sign-up", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  try {
    const userexists = await User.findOne({ email });
    if (userexists) {
      return res.status(400).json({
        message: "This Email is already Registered",
      });
    }
    const sameUsername = await User.findOne({ username });
    if (sameUsername) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    const pwdHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: pwdHash,
    });
    await newUser.save();
    res.status(200).json({
      success: true,
      message: "User Created!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid emailID or password",
      });
    }

    const userMatched = await bcrypt.compare(password, user.password);
    if (!userMatched) {
      return res.status(401).json({
        message: "Invalid emailID or password",
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        firstName,
        lastName,
        username,
        email,
        avatar,
        stats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      sucess: false,
      message: "Internal Server Error",
    });
  }
});
