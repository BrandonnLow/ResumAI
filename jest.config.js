const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: [
        '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
    ],
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/__tests__/__mocks__/',
        '<rootDir>/__tests__/utils/'
    ],
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        '!app/**/*.d.ts',
        '!app/**/layout.tsx',
        '!app/**/loading.tsx',
        '!app/**/not-found.tsx',
    ],
};

module.exports = createJestConfig(customJestConfig);
