import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import {
  CreateTruck,
  GetTrucks,
  GetTruckById,
  UpdateTruck,
  DeleteTruck,
  UpdateTruckLocation,
} from "../controllers/truck.controller.ts";

export const truckRouter = Router();

truckRouter.use(requireAuth);

truckRouter.get("/trucks", GetTrucks);
truckRouter.get("/trucks/:id", GetTruckById);
truckRouter.post("/trucks", CreateTruck);
truckRouter.patch("/trucks/:id", UpdateTruck);
truckRouter.patch("/trucks/:id/location", UpdateTruckLocation);
truckRouter.delete("/trucks/:id", DeleteTruck);
