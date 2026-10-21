import { describe, it, expect } from 'vitest';
import { flag, goalText } from './args';

describe('forge CLI args', () => {
  describe('goalText', () => {
    it('joins positional words', () => {
      expect(goalText(['Build', 'a', 'hello', 'API'])).toBe('Build a hello API');
    });

    it('keeps a single quoted argument as-is', () => {
      expect(goalText(['Build a Node/Express hello API with a test'])).toBe('Build a Node/Express hello API with a test');
    });

    it('does not let the --company value leak into the text (flag after)', () => {
      expect(goalText(['Build something', '--company', 'abc-123'])).toBe('Build something');
    });

    it('does not let the --company value leak into the text (flag before)', () => {
      expect(goalText(['--company', 'abc-123', 'Build', 'something'])).toBe('Build something');
    });

    it('flags only means no text', () => {
      expect(goalText(['--company', 'abc-123'])).toBe('');
      expect(goalText(['--verbose'])).toBe('');
      expect(goalText([])).toBe('');
    });

    it('ignores unknown boolean flags but keeps the words around them', () => {
      expect(goalText(['Build', '--fast', 'it'])).toBe('Build it');
    });

    it('trims surrounding whitespace', () => {
      expect(goalText(['  padded  '])).toBe('padded');
    });

    it('a trailing value-flag with no value does not throw', () => {
      expect(goalText(['Build', '--company'])).toBe('Build');
    });
  });

  describe('flag', () => {
    it('reads a flag value anywhere in the args', () => {
      expect(flag(['x', '--company', 'c1'], '--company')).toBe('c1');
      expect(flag(['--company', 'c1', 'x'], '--company')).toBe('c1');
    });

    it('is undefined when the flag is absent', () => {
      expect(flag(['x'], '--company')).toBeUndefined();
    });

    it('is undefined when the flag has no value or is followed by another flag', () => {
      expect(flag(['--company'], '--company')).toBeUndefined();
      expect(flag(['--company', '--other'], '--company')).toBeUndefined();
    });
  });
});

describe('forge CLI args — task options', () => {
  it('collects every --check in order and keeps them out of the text', async () => {
    const { flagAll, goalText } = await import('./args');
    const args = ['Build it', '--check', 'node -e "1"', '--direct', '--check', 'npm test'];
    expect(flagAll(args, '--check')).toEqual(['node -e "1"', 'npm test']);
    expect(goalText(args)).toBe('Build it');
  });

  it('a --check with no value is ignored', async () => {
    const { flagAll } = await import('./args');
    expect(flagAll(['x', '--check'], '--check')).toEqual([]);
    expect(flagAll(['x', '--check', '--direct'], '--check')).toEqual([]);
  });

  it('detects boolean flags', async () => {
    const { hasFlag } = await import('./args');
    expect(hasFlag(['a', '--direct'], '--direct')).toBe(true);
    expect(hasFlag(['a'], '--direct')).toBe(false);
  });

  it('goalFields keeps short text as the title and preserves long text in full', async () => {
    const { goalFields } = await import('./args');
    expect(goalFields('  Build   a thing ')).toEqual({ title: 'Build a thing' });
    const long = 'word '.repeat(60).trim();
    const f = goalFields(long);
    expect(f.title.length).toBeLessThanOrEqual(120);
    expect(f.title.endsWith('...')).toBe(true);
    expect(f.description).toBe(long);
  });
});
