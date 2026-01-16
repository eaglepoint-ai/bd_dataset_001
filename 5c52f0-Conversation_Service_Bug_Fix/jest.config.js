export const preset = "ts-jest";
export const testEnvironment = "node";
export const testMatch = ["<rootDir>/tests/**/*.test.ts"];
export const moduleNameMapper = {
    "^@prisma/client$": "<rootDir>/repository_after/node_modules/@prisma/client",
    "^\\.prisma/client$": "<rootDir>/repository_after/node_modules/.prisma/client"
};
export const transform = {
    "^.+\\.tsx?$": ["ts-jest", {
        tsconfig: "tsconfig.json"
    }]
};
export const modulePathIgnorePatterns = [
    "<rootDir>/repository_before/dist",
    "<rootDir>/repository_after/dist"
];
export const globalSetup = "<rootDir>/jest.setup.js";
