import { Elysia } from "elysia";
import { settingsController } from "./controller";

export const settingsRouter = new Elysia({ prefix: "/settings" })
  .get("/", settingsController.getSettings)
  .patch("/", settingsController.updateSettings)
  .post("/llm-names", settingsController.addLlmName)
  .delete("/llm-names/:name", settingsController.removeLlmName);