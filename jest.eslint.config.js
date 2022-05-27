/* eslint @typescript-eslint/indent: 0 */

module.exports = {
  runner: 'jest-runner-eslint',
  displayName: 'eslint',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/lib'],
};
