module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/repository_after', '<rootDir>/repository_before'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
  },
};
