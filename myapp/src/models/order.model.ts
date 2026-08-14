import { model } from "mongoose";
import { OrderSchema } from "../schemas/order.schema.ts";

export const Order = model("Order", OrderSchema);
