import { Elysia } from "elysia";

console.log("Environment:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("AI_KEY:", process.env.AI_KEY);

const app = new Elysia().get("/", () => "Hello Elysia").listen(Number(process.env.PORT) || 3002);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
