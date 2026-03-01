module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/jest.env.ts'],
  maxWorkers: 1,
  collectCoverageFrom: [
    'routes/**/*.ts',
    'middleware/**/*.ts',
    'utils/**/*.ts',
    '!**/*.d.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  watchman: false, // Disable watchman to avoid permission issues
};
