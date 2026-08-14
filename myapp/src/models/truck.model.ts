import { model } from "mongoose";
import { TruckSchema } from "../schemas/truck.schema.ts";

export const Truck = model("Truck", TruckSchema);
