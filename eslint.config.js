import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  eslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        Bun: "readonly",
        document: "readonly",
        HTMLInputElement: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "warn",
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" }
      ]
    }
  }
];
