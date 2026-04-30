export type SettingsDTO = {
  interfaceLanguage: string;
  llmNames: string[];
  defaultLlmName: string;
};

export type SettingsUpdateDTO = Partial<SettingsDTO>;