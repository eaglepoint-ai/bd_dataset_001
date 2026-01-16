module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    moduleNameMapper: {
        '^@app/(.*)$': 'repository_after/$1',
    },
    verbose: true,
};

