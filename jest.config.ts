import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/hex-terrain'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tests/hex-terrain/tsconfig.json',
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    testMatch: [
        '**/tests/hex-terrain/**/*.test.ts',
        '**/tests/hex-terrain/**/*.spec.ts',
    ],
};

export default config;
