import { ConnectDB } from "./config/db.ts";
import { app } from "./app.ts";
import "dotenv/config";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

await ConnectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
