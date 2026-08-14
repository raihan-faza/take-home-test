import { Schema } from "mongoose";
import { CoordinateSchema } from "./coordinate.schema.ts";

export const TruckSchema = new Schema({
  policeNumber: { type: Number, required: true },
  truckType: { type: String, required: true },
  location: { type: CoordinateSchema, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

TruckSchema.index({ location: "2dsphere" });
