import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Resolve workspace package to local source during tests
    '^@github-explorer/shared(.*)$': '<rootDir>/../shared/src$1'
  }
}

export default config
