import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * ESLint flat config (SEC-05 remediation).
 *
 * Replaces the broken `next lint` invocation. `next lint` is deprecated in
 * Next 15 and, without an existing ESLint config, prompts interactively for a
 * setup choice and hangs in CI. This uses the standard Next.js shareable config
 * through `FlatCompat` (the documented bridge for `eslint-config-next` under
 * ESLint 9 flat config), so `npm run lint` is a normal non-interactive command.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "graphify-out/**",
      // Generated Prisma client — regenerated on install, not hand-edited.
      "lib/generated/**",
      // Vendored agent skills / generated artifacts — not app code.
      ".agents/**",
      ".claude/**",
      ".kilo/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // The reveal-observer + storage tests run under `node --test` with the
    // Node type-stripping loader; they are plain TS with no framework rules.
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Test doubles implement interfaces with params they intentionally ignore.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];

export default config;
