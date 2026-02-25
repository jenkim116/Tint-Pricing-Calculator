import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  collectCoverageFrom: ["lib/**/*.ts", "!lib/**/*.d.ts"],
};

export default createJestConfig(config);
