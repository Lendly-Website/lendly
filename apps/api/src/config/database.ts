import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(uri = env.mongoUri): Promise<void> {
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
