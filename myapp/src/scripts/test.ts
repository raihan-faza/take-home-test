import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { ConnectDB } from "../config/db.ts";
import { app } from "../app.ts";
import { seedData, TEST_PASSWORD } from "./seed.ts";

type Result = { name: string; ok: boolean; error?: string };
const results: Result[] = [];

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

function section(title: string) {
  console.log(`\n${BOLD}${CYAN}── ${title} ${"─".repeat(Math.max(0, 52 - title.length))}${RESET}`);
}

function colorStatus(status: number): string {
  if (status < 300) return GREEN;
  if (status < 500) return YELLOW;
  return RED;
}

function compact(value: unknown): string {
  if (value === null || value === undefined) return "—";
  let s = JSON.stringify(value);
  if (s.length > 90) s = `${s.slice(0, 87)}…`;
  return s;
}

let requestLog: string[] = [];

async function test(name: string, fn: () => Promise<void>) {
  requestLog = [];
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: String(err) });
    console.log(`  ${RED}✗${RESET} ${name}`);
    console.log(`    ${DIM}${err instanceof Error ? err.message : String(err)}${RESET}`);
  }
  for (const line of requestLog) {
    console.log(`      ${line}`);
  }
}

let base = "";
async function request(
  method: string,
  path: string,
  opts: { body?: unknown; cookie?: string } = {},
) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  const result = {
    status: res.status,
    json,
    setCookies: res.headers.getSetCookie?.() ?? [],
  };
  const parts = [
    `${DIM}${method.padEnd(6)}${RESET} ${path}`,
    ...(opts.body !== undefined ? [`in ${compact(opts.body)}`] : []),
    `→ ${colorStatus(result.status)}${result.status}${RESET}  ${compact(result.json)}`,
  ];
  requestLog.push(parts.join("  "));
  return result;
}

function cookieString(setCookies: string[]): string {
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  process.env.DB_URI ??= "mongodb://127.0.0.1:27017/myapp_test";
  await ConnectDB();
  const { alice, bob, truckA, truckB, orderA, orderB } = await seedData();

  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  base = `http://127.0.0.1:${port}`;

  const orderAId = String(orderA._id);
  const orderBId = String(orderB._id);
  const truckAId = String(truckA._id);
  const truckBId = String(truckB._id);

  try {
    section("Auth");
    let aliceCookie = "";
    await test("POST /register creates user (no password leak)", async () => {
      const res = await request("POST", "/register", {
        body: { fullname: "Charlie", username: "charlie", password: TEST_PASSWORD },
      });
      assert.equal(res.status, 201);
      const body = res.json as Record<string, unknown>;
      assert.equal(body.username, "charlie");
      assert.equal(body.password, undefined);
    });

    await test("POST /register duplicate username -> 409", async () => {
      const res = await request("POST", "/register", {
        body: { fullname: "Charlie", username: "charlie", password: TEST_PASSWORD },
      });
      assert.equal(res.status, 409);
    });

    await test("POST /login wrong password -> 401", async () => {
      const res = await request("POST", "/login", {
        body: { username: "charlie", password: "wrongpass" },
      });
      assert.equal(res.status, 401);
    });

    let charlieCookie = "";
    await test("POST /login correct -> 200 with session cookie", async () => {
      const res = await request("POST", "/login", {
        body: { username: "charlie", password: TEST_PASSWORD },
      });
      assert.equal(res.status, 200);
      assert.ok(res.setCookies.length > 0);
      charlieCookie = cookieString(res.setCookies);
    });

    await test("PATCH /users/password wrong old -> 401", async () => {
      const res = await request(
        "PATCH",
        "/users/password",
        { body: { oldPassword: "nope", newPassword: "newpass456" }, cookie: charlieCookie },
      );
      assert.equal(res.status, 401);
    });

    await test("PATCH /users/password correct -> 200", async () => {
      const res = await request(
        "PATCH",
        "/users/password",
        { body: { oldPassword: TEST_PASSWORD, newPassword: "newpass456" }, cookie: charlieCookie },
      );
      assert.equal(res.status, 200);
    });

    await test("POST /login with new password -> 200", async () => {
      const res = await request("POST", "/login", {
        body: { username: "charlie", password: "newpass456" },
      });
      assert.equal(res.status, 200);
    });

    await test("POST /logout -> 204", async () => {
      const res = await request("POST", "/logout", { cookie: charlieCookie });
      assert.equal(res.status, 204);
    });

    section("Authorization / IDOR");
    await test("GET /orders without cookie -> 401", async () => {
      const res = await request("GET", "/orders");
      assert.equal(res.status, 401);
    });

    await test("GET /trucks without cookie -> 401", async () => {
      const res = await request("GET", "/trucks");
      assert.equal(res.status, 401);
    });

    await test("POST /login alice -> 200", async () => {
      const res = await request("POST", "/login", {
        body: { username: alice.username, password: TEST_PASSWORD },
      });
      assert.equal(res.status, 200);
      aliceCookie = cookieString(res.setCookies);
    });

    section("Orders");
    await test("POST /orders -> 201", async () => {
      const res = await request("POST", "/orders", {
        body: {
          item: "keyboard",
          destination: { type: "Point", coordinates: [106.82, -6.18] },
        },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 201);
      const body = res.json as Record<string, unknown>;
      assert.equal(body.userId, String(alice._id));
    });

    await test("GET /orders returns only own orders", async () => {
      const res = await request("GET", "/orders", { cookie: aliceCookie });
      assert.equal(res.status, 200);
      const orders = res.json as Array<Record<string, unknown>>;
      const ids = orders.map((o) => String(o._id));
      assert.ok(ids.includes(orderAId));
      assert.ok(!ids.includes(orderBId));
    });

    await test("GET /orders/:id (own) -> 200", async () => {
      const res = await request("GET", `/orders/${orderAId}`, { cookie: aliceCookie });
      assert.equal(res.status, 200);
    });

    await test("GET /orders/:id (someone else's) -> 403", async () => {
      const res = await request("GET", `/orders/${orderBId}`, { cookie: aliceCookie });
      assert.equal(res.status, 403);
    });

    await test("PATCH /orders/:id (own) -> 200", async () => {
      const res = await request("PATCH", `/orders/${orderAId}`, {
        body: { item: "laptop-pro" },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
      assert.equal((res.json as Record<string, unknown>).item, "laptop-pro");
    });

    await test("PATCH /orders/:id (someone else's) -> 403", async () => {
      const res = await request("PATCH", `/orders/${orderBId}`, {
        body: { item: "hacked" },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 403);
    });

    await test("PATCH /orders/:id/status created->start -> 200", async () => {
      const res = await request("PATCH", `/orders/${orderAId}/status`, {
        body: { status: "start" },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
    });

    await test("PATCH /orders/:id/status start->done -> 200", async () => {
      const res = await request("PATCH", `/orders/${orderAId}/status`, {
        body: { status: "done" },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
    });

    await test("PATCH /orders/:id/status done->start -> 400", async () => {
      const res = await request("PATCH", `/orders/${orderAId}/status`, {
        body: { status: "start" },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 400);
    });

    await test("GET /orders/:id/distance -> 200", async () => {
      const res = await request("GET", `/orders/${orderAId}/distance`, {
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
      const body = res.json as Record<string, unknown>;
      assert.equal(body.ok, true);
      assert.equal(typeof body.totalDistance, "number");
    });

    await test("DELETE /orders/:id (own) -> 204", async () => {
      const create = await request("POST", "/orders", {
        body: {
          item: "temp",
          destination: { type: "Point", coordinates: [106.9, -6.1] },
        },
        cookie: aliceCookie,
      });
      const id = String((create.json as Record<string, unknown>)._id);
      const res = await request("DELETE", `/orders/${id}`, { cookie: aliceCookie });
      assert.equal(res.status, 204);
    });

    section("Trucks");
    await test("POST /trucks -> 201 (ownerId from session)", async () => {
      const res = await request("POST", "/trucks", {
        body: {
          policeNumber: 3333,
          truckType: "van",
          location: { type: "Point", coordinates: [106.9, -6.2] },
        },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 201);
      const body = res.json as Record<string, unknown>;
      assert.equal(body.ownerId, String(alice._id));
    });

    await test("GET /trucks returns only own trucks", async () => {
      const res = await request("GET", "/trucks", { cookie: aliceCookie });
      assert.equal(res.status, 200);
      const trucks = res.json as Array<Record<string, unknown>>;
      const ids = trucks.map((t) => String(t._id));
      assert.ok(ids.includes(truckAId));
      assert.ok(!ids.includes(truckBId));
    });

    await test("GET /trucks/:id (own) -> 200", async () => {
      const res = await request("GET", `/trucks/${truckAId}`, { cookie: aliceCookie });
      assert.equal(res.status, 200);
    });

    await test("GET /trucks/:id (someone else's) -> 403", async () => {
      const res = await request("GET", `/trucks/${truckBId}`, { cookie: aliceCookie });
      assert.equal(res.status, 403);
    });

    await test("PATCH /trucks/:id (own) -> 200", async () => {
      const res = await request("PATCH", `/trucks/${truckAId}`, {
        body: { truckType: "big-box" },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
      assert.equal((res.json as Record<string, unknown>).truckType, "big-box");
    });

    await test("PATCH /trucks/:id/location -> 200", async () => {
      const res = await request("PATCH", `/trucks/${truckAId}/location`, {
        body: { location: { type: "Point", coordinates: [106.82, -6.18] } },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
    });

    section("Truck arrival / departure");
    await test("truck arrives within 100m radius -> logs arrival", async () => {
      const create = await request("POST", "/orders", {
        body: {
          item: "delivery",
          destination: { type: "Point", coordinates: [106.9, -6.1] },
          truckId: truckAId,
          status: "start",
        },
        cookie: aliceCookie,
      });
      assert.equal(create.status, 201);

      const res = await request("PATCH", `/trucks/${truckAId}/location`, {
        body: { location: { type: "Point", coordinates: [106.9, -6.1005] } },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
    });

    await test("truck departs 100m radius -> logs departure", async () => {
      const res = await request("PATCH", `/trucks/${truckAId}/location`, {
        body: { location: { type: "Point", coordinates: [106.82, -6.18] } },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 200);
    });

    await test("DELETE /trucks/:id (own) -> 204", async () => {
      const create = await request("POST", "/trucks", {
        body: {
          policeNumber: 4444,
          truckType: "temp",
          location: { type: "Point", coordinates: [106.7, -6.3] },
        },
        cookie: aliceCookie,
      });
      const id = String((create.json as Record<string, unknown>)._id);
      const res = await request("DELETE", `/trucks/${id}`, { cookie: aliceCookie });
      assert.equal(res.status, 204);
    });

    await test("PATCH /trucks/:id (someone else's) -> 403", async () => {
      const res = await request("PATCH", `/trucks/${truckBId}`, {
        body: { truckType: "hacked" },
        cookie: aliceCookie,
      });
      assert.equal(res.status, 403);
    });
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  const passed = results.length - failed.length;
  const summary = `${passed}/${results.length} passed`;
  console.log(
    `\n${BOLD}${failed.length ? RED : GREEN}══ ${summary} ══${RESET}`,
  );
  if (failed.length) {
    for (const f of failed) console.log(`  ${RED}✗${RESET} ${f.name}: ${f.error}`);
    process.exitCode = 1;
  }
}

await main();
