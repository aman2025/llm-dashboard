import { Elysia } from "elysia";
import { settingsRouter } from "@/modules/settings";

export const apiRouter = new Elysia({ prefix: "/api" }).use(settingsRouter);