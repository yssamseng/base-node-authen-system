const { describe, test, expect } = require('@jest/globals');

describe('Sample Test', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });

  test('should add numbers correctly', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});