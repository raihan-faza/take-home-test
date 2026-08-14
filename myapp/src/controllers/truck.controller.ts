import type { Request, Response } from "express";
import * as TruckService from "../services/truck.service.ts";

export async function CreateTruck(req: Request, res: Response) {
  const truck = await TruckService.CreateTruck(
    req.session.userId as string,
    req.body,
  );
  return res.status(201).json(truck);
}

export async function GetTrucks(req: Request, res: Response) {
  const trucks = await TruckService.GetTrucks(req.session.userId as string);
  return res.json(trucks);
}

export async function GetTruckById(req: Request, res: Response) {
  const truck = await TruckService.GetTruckById(
    req.params.id as string,
    req.session.userId as string,
  );
  if (!truck) {
    return res.status(404).json({ message: "Truck not found" });
  }
  return res.json(truck);
}

export async function UpdateTruck(req: Request, res: Response) {
  const truck = await TruckService.UpdateTruck(
    req.params.id as string,
    req.session.userId as string,
    req.body,
  );
  if (!truck) {
    return res.status(404).json({ message: "Truck not found" });
  }
  return res.json(truck);
}

export async function DeleteTruck(req: Request, res: Response) {
  const truck = await TruckService.DeleteTruck(
    req.params.id as string,
    req.session.userId as string,
  );
  if (!truck) {
    return res.status(404).json({ message: "Truck not found" });
  }
  return res.status(204).send();
}

export async function UpdateTruckLocation(req: Request, res: Response) {
  const truck = await TruckService.UpdateTruckLocation(
    req.params.id as string,
    req.session.userId as string,
    req.body,
  );
  return res.json(truck);
}
