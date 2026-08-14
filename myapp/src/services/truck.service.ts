import { Truck } from "../models/truck.model.ts";
import { Order } from "../models/order.model.ts";
import {
  createTruckSchema,
  updateTruckSchema,
  type CreateTruckInput,
  type UpdateTruckLocationInput,
  type UpdateTruckInput,
} from "../validators/truck.validator.ts";
import { ARRIVAL_RADIUS } from "../constant/constant.ts";
import { distance } from "@turf/turf";
import { HttpError } from "../errors/http.error.ts";

export async function CreateTruck(requesterId: string, input: CreateTruckInput) {
  const data = createTruckSchema.parse(input);
  return Truck.create({ ...data, ownerId: requesterId });
}

export async function GetTrucks(requesterId: string) {
  return Truck.find({ ownerId: requesterId });
}

export async function GetTruckById(id: string, requesterId: string) {
  const truck = await Truck.findById(id);
  if (!truck) {
    return null;
  }
  if (truck.ownerId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  return truck;
}

export async function UpdateTruck(
  id: string,
  requesterId: string,
  input: UpdateTruckInput,
) {
  const existing = await Truck.findById(id);
  if (!existing) {
    return null;
  }
  if (existing.ownerId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  const data = updateTruckSchema.parse(input);
  return Truck.findByIdAndUpdate(id, data, { new: true });
}

export async function DeleteTruck(id: string, requesterId: string) {
  const truck = await Truck.findById(id);
  if (!truck) {
    return null;
  }
  if (truck.ownerId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  return Truck.findByIdAndDelete(id);
}

export async function UpdateTruckLocation(
  id: string,
  requesterId: string,
  input: UpdateTruckLocationInput,
) {
  const truck = await Truck.findById(id);
  if (!truck) {
    throw new HttpError(404, "Truck not found");
  }
  if (truck.ownerId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }

  const newLocation = input.location;

  const order = await Order.findOne({ truckId: id, status: "start" });
  if (!order) {
    return Truck.findByIdAndUpdate(id, { location: newLocation });
  }

  const oldDistance = distance(
    truck.location.coordinates,
    order.destination.coordinates,
    { units: "meters" },
  );

  const newDistance = distance(
    newLocation.coordinates,
    order.destination.coordinates,
    { units: "meters" },
  );

  const wasInside = oldDistance <= ARRIVAL_RADIUS;
  const isInsideNow = newDistance <= ARRIVAL_RADIUS;

  if (isInsideNow && !wasInside) {
    console.log(`Truck ${id} arrived at destination for order ${order._id}`);
  } else if (!isInsideNow && wasInside) {
    console.log(`Truck ${id} departed destination for order ${order._id}`);
  }

  return Truck.findByIdAndUpdate(id, { location: newLocation });
}
