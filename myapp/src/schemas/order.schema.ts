import { Schema } from "mongoose";
import { CoordinateSchema } from "./coordinate.schema.ts";

export const OrderSchema = new Schema({
  status: { type: String, enum: ["created", "start", "done"], required: true },
  item: { type: String, required: true },
  destination: {
    type: CoordinateSchema,
    required: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  truckId: { type: Schema.Types.ObjectId, ref: "Truck", required: false },
});

OrderSchema.index({ destination: "2dsphere" });
