import dotenv from "dotenv";
import connectDB from "./db/connection.js";
import { server } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB();

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
