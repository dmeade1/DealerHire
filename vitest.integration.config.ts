import { defineConfig } from "vitest/config";
import path from "node:path";
import { loadEnvFile } from "./scripts/load-env";

loadEnvFile();

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    env: {
      ACCEPTANCE_ENVELOPE_BINDING: "local",
      CAPABILITY_SECRET: "test-only-capability-secret",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
