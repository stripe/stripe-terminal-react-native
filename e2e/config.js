module.exports = {
  maxWorkers: 1,
  testRunner: 'jest-circus/runner',
  testTimeout: 200000,
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.js'],
  reporters: ['detox/runners/jest/reporter', 'jest-junit'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  verbose: true,
};
