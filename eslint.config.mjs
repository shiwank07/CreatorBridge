import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      ".wrangler-dry-run/**",
      ".wrangler-dry-run-staging/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "blob-report/**",
      "playwright/.auth/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
