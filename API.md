# API Reference

## Authentication

- All order and truck routes require an authenticated session.
- Authentication is session based (`express-session`). Call `POST /login` to obtain a session cookie; send it on subsequent requests.
- Protected routes return `401 Unauthorized` when no valid session is present.

---

## Auth / User Routes

### `POST /register`

Create a new user account.

**Body (JSON):**

```json
{
  "fullname": "string (required)",
  "username": "string (required, unique)",
  "password": "string (required)"
}
```

**Responses:**

- `201 Created` — user object (password field is never returned).
- `400 Bad Request` — validation error.
- `409 Conflict` — username already taken.

---

### `POST /login`

Log in and create a session cookie.

**Body (JSON):**

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Responses:**

- `200 OK` — `{ "message": "Logged in" }`, sets session cookie.
- `401 Unauthorized` — invalid credentials.

---

### `PATCH /users/password`

Change the authenticated user's password. Requires session.

**Body (JSON):**

```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required)"
}
```

**Responses:**

- `200 OK` — `{ "message": "Password updated" }`.
- `401 Unauthorized` — not logged in, user not found, or incorrect old password.

---

### `POST /logout`

Destroy the current session.

**Responses:**

- `204 No Content` — logged out.
- `500 Internal Server Error` — logout failed.

---

## Order Routes

All order routes require an authenticated session. Each order belongs to the authenticated user; accessing another user's order returns `403 Forbidden`.

### `POST /orders`

Create a new order for the authenticated user.

**Body (JSON):**

```json
{
  "item": "string (required)",
  "destination": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "truckId": "ObjectId (optional, 24-char hex)",
  "status": "created | start | done (optional, default: created)"
}
```

**Responses:**

- `201 Created` — created order (includes `userId` from session).
- `400 Bad Request` — validation error.

---

### `GET /orders`

List all orders belonging to the authenticated user.

**Responses:**

- `200 OK` — array of order objects.

---

### `GET /orders/:id`

Get a single order by id.

**Responses:**

- `200 OK` — order object.
- `403 Forbidden` — order belongs to another user.
- `404 Not Found` — order does not exist.

---

### `PATCH /orders/:id`

Update an order's mutable fields.

**Body (JSON, all optional):**

```json
{
  "item": "string",
  "destination": { "type": "Point", "coordinates": [longitude, latitude] },
  "truckId": "ObjectId (24-char hex)",
  "status": "created | start | done"
}
```

Status transitions are validated (`created -> start -> done`).

**Responses:**

- `200 OK` — updated order.
- `400 Bad Request` — validation error (including invalid status transition).
- `403 Forbidden` — order belongs to another user.
- `404 Not Found` — order does not exist.

---

### `PATCH /orders/:id/status`

Update only the order status.

**Body (JSON):**

```json
{
  "status": "created | start | done (required)"
}
```

**Responses:**

- `200 OK` — updated order.
- `400 Bad Request` — invalid transition, with message listing allowed next statuses.
- `403 Forbidden` — order belongs to another user.
- `404 Not Found` — order does not exist.

---

### `GET /orders/:id/distance`

Calculate the distance (meters) between the order's destination and its assigned truck's current location.

**Responses:**

- `200 OK` — `{ "ok": true, "totalDistance": number }`.
- `403 Forbidden` — order belongs to another user.
- `404 Not Found` — order or assigned truck does not exist.

---

### `DELETE /orders/:id`

Delete an order.

**Responses:**

- `204 No Content` — deleted.
- `403 Forbidden` — order belongs to another user.
- `404 Not Found` — order does not exist.

---

## Truck Routes

All truck routes require an authenticated session. Each truck belongs to the authenticated user (`ownerId`); accessing another user's truck returns `403 Forbidden`.

### `POST /trucks`

Create a new truck for the authenticated user.

**Body (JSON):**

```json
{
  "policeNumber": "number (required)",
  "truckType": "string (required)",
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  }
}
```

**Responses:**

- `201 Created` — created truck (includes `ownerId` from session).
- `400 Bad Request` — validation error.

---

### `GET /trucks`

List all trucks belonging to the authenticated user.

**Responses:**

- `200 OK` — array of truck objects.

---

### `GET /trucks/:id`

Get a single truck by id.

**Responses:**

- `200 OK` — truck object.
- `403 Forbidden` — truck belongs to another user.
- `404 Not Found` — truck does not exist.

---

### `PATCH /trucks/:id`

Update a truck's `policeNumber` and/or `truckType`.

**Body (JSON, all optional):**

```json
{
  "policeNumber": "number",
  "truckType": "string"
}
```

**Responses:**

- `200 OK` — updated truck.
- `400 Bad Request` — validation error.
- `403 Forbidden` — truck belongs to another user.
- `404 Not Found` — truck does not exist.

---

### `PATCH /trucks/:id/location`

Update a truck's location. If the truck has an active order with status `start`, moving in/out of the arrival radius (100 m) triggers arrival/departure logging.

**Body (JSON):**

```json
{
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  }
}
```

**Responses:**

- `200 OK` — updated truck.
- `400 Bad Request` — validation error.
- `403 Forbidden` — truck belongs to another user.
- `404 Not Found` — truck does not exist.

---

### `DELETE /trucks/:id`

Delete a truck.

**Responses:**

- `204 No Content` — deleted.
- `403 Forbidden` — truck belongs to another user.
- `404 Not Found` — truck does not exist.

---

## Shared Notes

- **Coordinates** are GeoJSON `[longitude, latitude]` (longitude: -180..180, latitude: -90..90).
- **Object IDs** are 24-character hex strings.
- **Order statuses:** `created`, `start`, `done`. Allowed transitions: `created -> start -> done`.
- **Error shape:** `{ "message": "..." }`.
