module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-root-toast|@stripe/stripe-terminal-react-native)',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '\\.png$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
  },
};
