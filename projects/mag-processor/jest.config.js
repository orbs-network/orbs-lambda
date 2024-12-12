module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.js'],
    testMatch: ['**/test/**/*.spec.js'],
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
  };