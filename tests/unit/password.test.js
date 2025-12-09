import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from '../../src/utils/password.js';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    test('should hash password successfully', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(50);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty password', async () => {
      const password = '';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      const result = await comparePassword(password, hashed);
      expect(result).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashed = await hashPassword(password);
      
      const result = await comparePassword(wrongPassword, hashed);
      expect(result).toBe(false);
    });

    test('should return false for empty password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      const result = await comparePassword('', hashed);
      expect(result).toBe(false);
    });

    test('should handle invalid hash gracefully', async () => {
      const password = 'testPassword123';
      const invalidHash = 'invalid_hash';
      
      const result = await comparePassword(password, invalidHash);
      expect(result).toBe(false);
    });
  });
});