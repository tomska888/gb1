import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    sequence: {
      concurrent: false,
    },
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    coverage: {
      reporter: ["text", "json", "html"],
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/types",
        "src/index.ts",
        "src/config/database.ts",
        "src/migrations",
        "src/kysely-migrate.config.ts",
      ],
    },
  },
});
