import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { SettingsDTO, SettingsUpdateDTO } from "./types";

export class SettingsService {
  async getSettings(): Promise<SettingsDTO> {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          interfaceLanguage: "en",
          llmNames: [],
          defaultLlmName: "",
        },
      });
    }

    return {
      interfaceLanguage: settings.interfaceLanguage,
      llmNames: settings.llmNames,
      defaultLlmName: settings.defaultLlmName,
    };
  }

  async updateSettings(data: SettingsUpdateDTO): Promise<SettingsDTO> {
    if (data.defaultLlmName && data.llmNames) {
      if (!data.llmNames.includes(data.defaultLlmName)) {
        throw new AppError("VALIDATION_ERROR", "defaultLlmName must be in llmNames array");
      }
    }

    const settings = await prisma.settings.update({
      where: { id: 1 },
      data: {
        interfaceLanguage: data.interfaceLanguage,
        llmNames: data.llmNames,
        defaultLlmName: data.defaultLlmName,
      },
    });

    return {
      interfaceLanguage: settings.interfaceLanguage,
      llmNames: settings.llmNames,
      defaultLlmName: settings.defaultLlmName,
    };
  }

  async addLlmName(name: string): Promise<SettingsDTO> {
    const settings = await this.getSettings();

    if (settings.llmNames.includes(name)) {
      throw new AppError("CONFLICT", `LLM name "${name}" already exists`);
    }

    const updated = await prisma.settings.update({
      where: { id: 1 },
      data: {
        llmNames: [...settings.llmNames, name],
      },
    });

    return {
      interfaceLanguage: updated.interfaceLanguage,
      llmNames: updated.llmNames,
      defaultLlmName: updated.defaultLlmName,
    };
  }

  async removeLlmName(name: string): Promise<SettingsDTO> {
    const settings = await this.getSettings();

    if (!settings.llmNames.includes(name)) {
      throw new AppError("NOT_FOUND", `LLM name "${name}" not found`);
    }

    const newDefaultLlmName =
      settings.defaultLlmName === name ? "" : settings.defaultLlmName;

    const updated = await prisma.settings.update({
      where: { id: 1 },
      data: {
        llmNames: settings.llmNames.filter((n) => n !== name),
        defaultLlmName: newDefaultLlmName,
      },
    });

    return {
      interfaceLanguage: updated.interfaceLanguage,
      llmNames: updated.llmNames,
      defaultLlmName: updated.defaultLlmName,
    };
  }
}

export const settingsService = new SettingsService();