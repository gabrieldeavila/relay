import { defineConfig } from "vitest/config";

/** Specs cover pure rules in `domain/` folders; no browser needed. */
export default defineConfig({
  test: { include: ["app/**/*.spec.ts"], environment: "node" },
});
