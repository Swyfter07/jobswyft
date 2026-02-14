import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "chrome",
          message: "Chrome APIs are not allowed in @jobswyft/engine. Keep the engine package pure.",
        },
        {
          name: "browser",
          message: "Browser APIs are not allowed in @jobswyft/engine. Keep the engine package pure.",
        },
      ],
    },
  },
];
