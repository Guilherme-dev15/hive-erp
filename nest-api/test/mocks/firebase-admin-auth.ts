export const getAuth = () => ({
  verifyIdToken: jest.fn().mockRejectedValue(new Error('Firebase auth is not available in unit tests')),
});
