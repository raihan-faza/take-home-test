import { Order } from "../models/order.model.ts";
import { Truck } from "../models/truck.model.ts";
import {
  allowedNextStatus,
  createOrderSchema,
  updateOrderSchema,
  updateStatusSchema,
  type CreateOrderInput,
  type UpdateOrderInput,
  type OrderStatus,
} from "../validators/order.validator.ts";
import { distance } from "@turf/turf";
import { HttpError } from "../errors/http.error.ts";

export async function CreateOrder(requesterId: string, input: CreateOrderInput) {
  const data = createOrderSchema.parse(input);
  return Order.create({ ...data, userId: requesterId });
}

export async function GetOrders(requesterId: string) {
  return Order.find({ userId: requesterId });
}

export async function GetOrderById(id: string, requesterId: string) {
  const order = await Order.findById(id);
  if (!order) {
    return null;
  }
  if (order.userId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  return order;
}

export async function UpdateOrder(
  id: string,
  requesterId: string,
  input: UpdateOrderInput,
) {
  const existing = await Order.findById(id);
  if (!existing) {
    return null;
  }
  if (existing.userId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  const data = updateOrderSchema(existing.status as OrderStatus).parse(input);
  return Order.findByIdAndUpdate(id, data, { new: true });
}

export async function DeleteOrder(id: string, requesterId: string) {
  const order = await Order.findById(id);
  if (!order) {
    return null;
  }
  if (order.userId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  return Order.findByIdAndDelete(id);
}

export async function UpdateOrderStatus(
  id: string,
  requesterId: string,
  input: { status: OrderStatus },
) {
  const existing = await Order.findById(id);
  if (!existing) {
    return { ok: false as const, code: "not_found" as const };
  }
  if (existing.userId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  const data = updateStatusSchema.parse(input);
  const currentStatus = existing.status as OrderStatus;
  const allowed = allowedNextStatus[currentStatus];
  if (!allowed.includes(data.status)) {
    return {
      ok: false as const,
      code: "invalid_transition" as const,
      currentStatus,
      status: data.status,
      allowed,
    };
  }
  const order = await Order.findByIdAndUpdate(
    id,
    { status: data.status },
    { new: true },
  );
  return { ok: true as const, order };
}

export async function CheckOrderDistance(orderId: string, requesterId: string) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new HttpError(404, "Order not found");
  }
  if (order.userId.toString() !== requesterId) {
    throw new HttpError(403, "Forbidden");
  }
  const truck = await Truck.findById(order.truckId);
  if (!truck) {
    throw new HttpError(404, "Truck not found");
  }
  const totalDistance = distance(
    order.destination.coordinates,
    truck.location.coordinates,
    { units: "meters" },
  );
  return { ok: true as const, totalDistance };
}
