import mongoose from "mongoose";
import type { Connection } from "mongoose";

export async function ConnectDB(): Promise<Connection> {
  console.log("Connecting to DB.");
  await mongoose.connect(process.env.DB_URI as string);
  mongoose.connection.on("error", (err) => {
    console.error("Connection error:", err);
  });
  mongoose.connection.on("connected", () => console.log("DB connected."));
  return mongoose.connection;
}
