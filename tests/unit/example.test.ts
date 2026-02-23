import { describe, it, expect } from 'vitest';

describe('Example Unit Test', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with arrays', () => {
    const items = ['apple', 'banana', 'orange'];
    expect(items).toHaveLength(3);
    expect(items).toContain('banana');
  });

  it('should work with objects', () => {
    const user = { name: 'John', age: 30 };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('John');
  });
});
