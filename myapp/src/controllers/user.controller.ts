import type { Request, Response } from "express";
import * as UserService from "../services/user.service.ts";

export async function CreateUser(req: Request, res: Response) {
  const user = await UserService.CreateUser(req.body);
  return res.status(201).json(user);
}

export async function GetUsers(_req: Request, res: Response) {
  const users = await UserService.GetUsers();
  return res.json(users);
}

export async function GetUserById(req: Request, res: Response) {
  const user = await UserService.GetUserById(req.params.id as string);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
}

export async function UpdateUser(req: Request, res: Response) {
  const user = await UserService.UpdateUser(req.params.id as string, req.body);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
}

export async function DeleteUser(req: Request, res: Response) {
  const user = await UserService.DeleteUser(req.params.id as string);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(204).send();
}

export async function Register(req: Request, res: Response) {
  const user = await UserService.Register(req.body);
  if (!user) {
    return res.status(409).json({ message: "Username already taken" });
  }
  return res.status(201).json(user);
}

export async function Login(req: Request, res: Response) {
  const user = await UserService.Login(req.body);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });

  req.session.userId = String(user._id);

  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

  return res.json({ message: "Logged in" });
}

export async function ChangePassword(req: Request, res: Response) {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const result = await UserService.ChangePassword(userId, req.body);
  if (result === "not_found") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (result === "invalid_old_password") {
    return res.status(401).json({ message: "Invalid old password" });
  }
  return res.json({ message: "Password updated" });
}

export async function Logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    return res.status(204).send();
  });
}
