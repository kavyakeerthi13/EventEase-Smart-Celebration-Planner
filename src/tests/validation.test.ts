import { describe, it, expect } from 'vitest';
import {
  isValidName,
  isValidAmount,
  isValidDate,
  isValidEmail,
  isValidPhone,
  sanitizeText,
} from '../utils';

describe('Input Validation & Security Sanitization', () => {
  it('validates name strings with length bounds', () => {
    expect(isValidName('Grand Wedding')).toBe(true);
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('')).toBe(false);
    expect(isValidName('a'.repeat(250))).toBe(false);
  });

  it('validates positive amounts and rejects negative/invalid numbers', () => {
    expect(isValidAmount('500')).toBe(true);
    expect(isValidAmount('0')).toBe(true);
    expect(isValidAmount('129.99')).toBe(true);
    expect(isValidAmount('-50')).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
  });

  it('validates dates correctly', () => {
    expect(isValidDate('2026-12-25')).toBe(true);
    expect(isValidDate('invalid-date')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });

  it('validates email addresses', () => {
    expect(isValidEmail('guest@domain.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(true); // Optional fields return true when empty
  });

  it('validates phone numbers', () => {
    expect(isValidPhone('+1-555-0123')).toBe(true);
    expect(isValidPhone('5551234567')).toBe(true);
    expect(isValidPhone('not-a-number-too-short')).toBe(false);
    expect(isValidPhone('')).toBe(true); // Optional fields return true when empty
  });

  it('sanitizes malicious script tags and HTML injections (XSS prevention)', () => {
    const maliciousInput = '<script>alert("hacked")</script>Hello <b>World</b>';
    const cleaned = sanitizeText(maliciousInput);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('</script>');
    expect(cleaned).not.toContain('alert');
    expect(cleaned).toBe('Hello World');
  });
});
