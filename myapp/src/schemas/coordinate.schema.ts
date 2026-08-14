import { Schema } from "mongoose";
import { type Coordinate } from "../interfaces/coordinate.interface.ts";

export const CoordinateSchema = new Schema<Coordinate>(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) =>
          value.length === 2 &&
          value[0] >= -180 &&
          value[0] <= 180 &&
          value[1] >= -90 &&
          value[1] <= 90,
        message:
          "coordinates must be [longitude, latitude] within valid bounds",
      },
    },
  },
  { _id: false },
);
