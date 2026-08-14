import type { Request, Response } from "express";
import * as OrderService from "../services/order.service.ts";

export async function CreateOrder(req: Request, res: Response) {
  const order = await OrderService.CreateOrder(
    req.session.userId as string,
    req.body,
  );
  return res.status(201).json(order);
}

export async function GetOrders(req: Request, res: Response) {
  const orders = await OrderService.GetOrders(req.session.userId as string);
  return res.json(orders);
}

export async function GetOrderById(req: Request, res: Response) {
  const order = await OrderService.GetOrderById(
    req.params.id as string,
    req.session.userId as string,
  );
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.json(order);
}

export async function UpdateOrder(req: Request, res: Response) {
  const order = await OrderService.UpdateOrder(
    req.params.id as string,
    req.session.userId as string,
    req.body,
  );
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.json(order);
}

export async function DeleteOrder(req: Request, res: Response) {
  const order = await OrderService.DeleteOrder(
    req.params.id as string,
    req.session.userId as string,
  );
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.status(204).send();
}

export async function UpdateOrderStatus(req: Request, res: Response) {
  const result = await OrderService.UpdateOrderStatus(
    req.params.id as string,
    req.session.userId as string,
    req.body,
  );
  if (!result.ok) {
    if (result.code === "not_found") {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(400).json({
      message: `Cannot transition from "${result.currentStatus}" to "${result.status}". Allowed: ${
        result.allowed.length ? result.allowed.join(", ") : "none"
      }`,
    });
  }
  return res.json(result.order);
}

export async function CheckOrderDistance(req: Request, res: Response) {
  const result = await OrderService.CheckOrderDistance(
    req.params.id as string,
    req.session.userId as string,
  );
  return res.json(result);
}
