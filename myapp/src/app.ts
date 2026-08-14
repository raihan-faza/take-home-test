import express from "express";
import session from "express-session";
import { userRouter } from "./routes/user.route.ts";
import { orderRouter } from "./routes/order.route.ts";
import { truckRouter } from "./routes/truck.route.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";

export const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(userRouter);
app.use(orderRouter);
app.use(truckRouter);

app.use(errorHandler);
