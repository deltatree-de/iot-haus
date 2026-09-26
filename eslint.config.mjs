import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "_bmad/**",
      "_bmad-output/**",
      ".claude/**",
      "next-env.d.ts",
    ],
  },
  {
    // Keine Debug-Ausgaben im Client und Server (FR-35); Serverlogs nur über server/log.ts.
    files: ["src/**/*.{ts,tsx}", "server/**/*.ts"],
    ignores: ["server/log.ts"],
    rules: {
      "no-console": ["warn", { allow: ["error"] }],
    },
  },
];

export default eslintConfig;
