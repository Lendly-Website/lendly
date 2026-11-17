import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function main() {
  await connectDatabase();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`LENDLY API listening on http://localhost:${env.port}`);
  });

  function shutdown(signal: string) {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => process.exit(0));
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Unable to start LENDLY API", error);
  process.exit(1);
});
