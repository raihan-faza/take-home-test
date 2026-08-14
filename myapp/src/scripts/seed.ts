import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ConnectDB } from "../config/db.ts";
import { User } from "../models/user.model.ts";
import { Truck } from "../models/truck.model.ts";
import { Order } from "../models/order.model.ts";
import { SALT_ROUNDS } from "../constant/constant.ts";

export const TEST_PASSWORD = "password123";

export async function seedData() {
  await User.deleteMany({});
  await Truck.deleteMany({});
  await Order.deleteMany({});

  const password = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  const alice = await User.create({
    fullname: "Alice",
    username: "alice",
    password,
  });
  const bob = await User.create({
    fullname: "Bob",
    username: "bob",
    password,
  });

  const truckA = await Truck.create({
    policeNumber: 1111,
    truckType: "box",
    location: { type: "Point", coordinates: [106.816, -6.175] },
    ownerId: alice._id,
  });

  const truckB = await Truck.create({
    policeNumber: 2222,
    truckType: "tanker",
    location: { type: "Point", coordinates: [107.6, -6.9] },
    ownerId: bob._id,
  });

  const orderA = await Order.create({
    status: "created",
    item: "laptop",
    destination: { type: "Point", coordinates: [106.82, -6.18] },
    userId: alice._id,
    truckId: truckA._id,
  });

  const orderB = await Order.create({
    status: "created",
    item: "phone",
    destination: { type: "Point", coordinates: [107.6, -6.9] },
    userId: bob._id,
    truckId: truckB._id,
  });

  return { alice, bob, truckA, truckB, orderA, orderB };
}

const entry = pathToFileURL(resolve(process.argv[1] ?? "")).href;
const isMain = import.meta.url === entry;

if (isMain) {
  process.env.DB_URI ??= "mongodb://127.0.0.1:27017/myapp_test";
  await ConnectDB();
  const data = await seedData();
  console.log("Seeded data:");
  console.log("  users  :", [data.alice.username, data.bob.username]);
  console.log("  trucks :", [String(data.truckA._id), String(data.truckB._id)]);
  console.log("  orders :", [String(data.orderA._id), String(data.orderB._id)]);
  console.log(`  password for all users: "${TEST_PASSWORD}"`);
  await mongoose.disconnect();
  console.log("Done.");
}
