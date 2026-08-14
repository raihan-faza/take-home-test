import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import {
  CreateOrder,
  GetOrders,
  GetOrderById,
  UpdateOrder,
  UpdateOrderStatus,
  DeleteOrder,
  CheckOrderDistance,
} from "../controllers/order.controller.ts";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.get("/orders", GetOrders);
orderRouter.get("/orders/:id", GetOrderById);
orderRouter.post("/orders", CreateOrder);
orderRouter.patch("/orders/:id", UpdateOrder);
orderRouter.patch("/orders/:id/status", UpdateOrderStatus);
orderRouter.get("/orders/:id/distance", CheckOrderDistance);
orderRouter.delete("/orders/:id", DeleteOrder);
