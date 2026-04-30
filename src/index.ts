/* eslint-disable no-console */
import { app } from "./app";
import { prisma } from "@/lib/prisma";
import { config } from "@/config";

console.log("Environment:", config.NODE_ENV);
console.log("PORT:", config.PORT);
console.log("DATABASE_URL:", config.DATABASE_URL);

app.onStart(() => {
  console.log("Connecting to database...");
});

app.onStop(async () => {
  console.log("Disconnecting from database...");
  await prisma.$disconnect();
});

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);