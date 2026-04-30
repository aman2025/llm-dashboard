import { settingsService } from "./service";
import { settingsUpdateSchema, addLlmNameSchema } from "./validation";
import { AppError } from "@/lib/errors";

export const settingsController = {
  async getSettings() {
    const settings = await settingsService.getSettings();
    return { success: true, data: settings };
  },

  async updateSettings({ body, set }: { body: unknown; set: { status: number } }) {
    const parseResult = settingsUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      set.status = 400;
      return {
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      };
    }

    const settings = await settingsService.updateSettings(parseResult.data);
    return { success: true, data: settings };
  },

  async addLlmName({ body, set }: { body: unknown; set: { status: number } }) {
    const parseResult = addLlmNameSchema.safeParse(body);

    if (!parseResult.success) {
      set.status = 400;
      return {
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      };
    }

    try {
      const settings = await settingsService.addLlmName(parseResult.data.name);
      return { success: true, data: settings };
    } catch (error: unknown) {
      if (error instanceof AppError && error.code === "CONFLICT") {
        set.status = 409;
        return { success: false, error: error.message };
      }
      throw error;
    }
  },

  async removeLlmName({ params, set }: { params: { name: string }; set: { status: number } }) {
    const name = decodeURIComponent(params.name);

    try {
      const settings = await settingsService.removeLlmName(name);
      return { success: true, data: settings };
    } catch (error: unknown) {
      if (error instanceof AppError && error.code === "NOT_FOUND") {
        set.status = 404;
        return { success: false, error: error.message };
      }
      throw error;
    }
  },
};