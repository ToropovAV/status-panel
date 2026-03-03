'use strict';

const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
  modulePaths: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{ts,tsx,js}'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2018',
          loose: false,
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
        },
      },
    ],
  },
  transformIgnorePatterns: [nodeModulesToTransform(grafanaESModules)],
};
