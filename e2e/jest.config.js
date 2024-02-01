module.exports = {
  maxWorkers: 1,
  testTimeout: 200000,
  rootDir: '.',
  testMatch: ['<rootDir>/*.e2e.js'],
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
