import { Router } from "express";
import {
  Register,
  Login,
  ChangePassword,
  Logout,
} from "../controllers/user.controller.ts";

export const userRouter = Router();

userRouter.post("/register", Register);
userRouter.post("/login", Login);
userRouter.patch("/users/password", ChangePassword);
userRouter.post("/logout", Logout);
