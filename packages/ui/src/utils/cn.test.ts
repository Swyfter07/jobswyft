import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('merges tailwind classes with conflict resolution', () => {
    const result = cn('px-2 py-1', 'px-4');
    // tailwind-merge should resolve px-2 vs px-4 conflict
    expect(result).toBe('py-1 px-4');
  });

  it('handles arrays and objects', () => {
    const result = cn(['foo', 'bar'], { baz: true, qux: false });
    expect(result).toBe('foo bar baz');
  });

  it('handles undefined and null gracefully', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });
});
