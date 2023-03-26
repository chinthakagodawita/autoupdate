import { isRequestError } from '../../src/helpers/isRequestError';

describe('isRequestError', () => {
  class MockRequestError extends Error {
    constructor(public readonly status: number) {
      super();
    }
  }

  it('should return true if a request error with a status is provided', () => {
    const error = new MockRequestError(403);
    expect(isRequestError(error)).toBe(true);
  });

  it('should return false if a non-request error is provided', () => {
    const error = new Error('not a request error');
    expect(isRequestError(error)).toBe(false);
  });
});
