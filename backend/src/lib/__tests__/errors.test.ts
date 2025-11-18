import { describe, it, expect } from 'vitest';
import { NotFoundError, BadRequestError, ConflictError } from '../errors';

describe('Error Classes', () => {
  describe('NotFoundError', () => {
    it('should create error with default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create error with custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('BadRequestError', () => {
    it('should create error with default message', () => {
      const error = new BadRequestError();

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
    });

    it('should create error with custom message', () => {
      const error = new BadRequestError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ConflictError', () => {
    it('should create error with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    it('should create error with custom message', () => {
      const error = new ConflictError('Repository name already exists');

      expect(error.message).toBe('Repository name already exists');
      expect(error.statusCode).toBe(409);
    });
  });
});
