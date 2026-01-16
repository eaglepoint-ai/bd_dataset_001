const path = require('path');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            }
        }]
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Force React from root node_modules
    moduleNameMapper: {
        '^react$': path.join(__dirname, '../node_modules/react'),
        '^react-dom$': path.join(__dirname, '../node_modules/react-dom'),
    },
};
