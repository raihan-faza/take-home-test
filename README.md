# myapp

## Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Web framework:** Express 5
- **Database:** MongoDB via Mongoose
- **Validation:** Zod
- **Auth:** express-session (session cookie) + bcrypt (password hashing)
- **Geospatial:** Turf.js (`@turf/turf`)

## Setup

### Prerequisites

- **Node.js** 22.18+ (or 23.6+) — runs TypeScript natively via type stripping (no build step).
- **MongoDB** running locally (e.g. `mongodb://127.0.0.1:27017`).

### Installation

```bash
cd myapp
npm install
```

### Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` as needed. Defaults:

| Variable         | Default                          | Description                              |
| ---------------- | -------------------------------- | ---------------------------------------- |
| `DB_URI`         | `mongodb://127.0.0.1:27017/myapp` | MongoDB connection string                |
| `SESSION_SECRET` | `change-me-to-a-random-string`    | Secret for signing session cookies       |
| `PORT`           | `3000`                            | HTTP port                                |
| `NODE_ENV`       | `development`                     | Set to `production` for secure cookies   |

### Run the server

```bash
node src/index.ts
```

The server starts on `http://localhost:3000`.

### Seed test data (optional)

```bash
npm run seed
```

Creates two users (`alice`, `bob`), two trucks, and two orders (all passwords: `password123`).

### Run the API test suite

```bash
npm run test
```

Uses `mongodb://127.0.0.1:27017/myapp_test` by default.

## Assumptions and Explanation
When i get the task, i got some specification to create some schema and api. There are some things that i change:
- In the spec, the location and destination consist of [latitude, longitude]. But when i read the GeoJSON Specification, GeoJSON uses [longitude, latitude] format, so i have to change the location and destination format to follow the GeoJSON Specification.
- I assume 1 truck will deliver 1 item only.
- In the spec, there are no references to truck from order, so i add truckId for convenience in tracking order and know which truck bring the order.
- I'm assuming the order api will be used by customer to see where does the item located, is it arriving already.

## Things for Improvement
There are some things to improve:
- Test with more edge cases, i realize geofencing have several edge cases, for example if the gps location update late, or other edge cases that i havent discovered yet. And i dont have enough time to test them all.
- The current logs is not persistence, so it only shows the log in terminal, it would be nice if the logs are saved so we can see them later on.
- Adding api documentation using swagger for convenience and for improving readability.
- I'm currently using mvc style folder, if i have enough time maybe i want to change it into clean architecture, this is just out of personal reference because i've been using it in golang and it felt good doing it. Even though there are more things to do.
- Dockerize the app so i can run it on a container and make other dev easier to run it as well.

## Api Documentation
For the api documentation, you can go to [`API.md`](./API.md) for detailed documentation.

## Directory Structure

```
myapp/
├── src/
│   ├── app.ts                     # Express app setup (middleware, session, routes, error handler)
│   ├── index.ts                   # Entry point: connects to DB and starts the server
│   ├── config/
│   │   └── db.ts                  # MongoDB connection
│   ├── constant/
│   │   └── constant.ts            # Shared constants (salt rounds, radius, etc.)
│   ├── controllers/
│   │   ├── user.controller.ts     # HTTP handlers for auth + user routes
│   │   ├── order.controller.ts    # HTTP handlers for order routes
│   │   └── truck.controller.ts    # HTTP handlers for truck routes
│   ├── services/
│   │   ├── user.service.ts        # User business logic
│   │   ├── order.service.ts       # Order business logic
│   │   └── truck.service.ts       # Truck business logic
│   ├── models/
│   │   ├── user.model.ts          # User Mongoose model
│   │   ├── order.model.ts         # Order Mongoose model
│   │   └── truck.model.ts         # Truck Mongoose model
│   ├── schemas/
│   │   ├── user.schema.ts         # User schema definition
│   │   ├── order.schema.ts        # Order schema definition
│   │   ├── truck.schema.ts        # Truck schema definition
│   │   └── coordinate.schema.ts   # GeoJSON Point sub-schema
│   ├── validators/
│   │   ├── user.validator.ts      # Zod schemas for user input
│   │   ├── order.validator.ts     # Zod schemas for order input
│   │   └── truck.validator.ts     # Zod schemas for truck input
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # requireAuth (session check)
│   │   └── error.middleware.ts    # Centralized error handler
│   ├── errors/
│   │   └── http.error.ts          # HttpError class
│   ├── interfaces/
│   │   └── coordinate.interface.ts # Coordinate (GeoJSON Point) type
│   ├── types/
│   │   └── express-session.d.ts   # Session type augmentation
│   ├── routes/
│   │   ├── user.route.ts          # Auth/user endpoints
│   │   ├── order.route.ts         # Order endpoints
│   │   └── truck.route.ts         # Truck endpoints
│   └── scripts/
│       ├── seed.ts                # Test data seeder
│       └── test.ts                # API test suite
├── .env.example                   # Environment variable template
├── package.json
└── tsconfig.json
```
