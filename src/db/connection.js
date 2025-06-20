import mongoose from "mongoose";
import { db_name } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/ ${db_name}`,
    );
    console.log(
      ` \n MongoDB connected successfully || DB_HOST ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

export default connectDB;
