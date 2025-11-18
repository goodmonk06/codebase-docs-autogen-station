import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

export function createErrorHandler() {
  return async (
    error: FastifyError | Error,
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };

    // Zod validation errors
    if (error instanceof ZodError) {
      errorResponse.error = 'Validation Error';
      errorResponse.message = 'Invalid request data';
      errorResponse.statusCode = 400;
      errorResponse.details = error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      reply.code(400).send(errorResponse);
      return;
    }

    // Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          errorResponse.error = 'Conflict';
          errorResponse.message = 'A record with this value already exists';
          errorResponse.statusCode = 409;
          break;
        case 'P2025':
          errorResponse.error = 'Not Found';
          errorResponse.message = 'Record not found';
          errorResponse.statusCode = 404;
          break;
        default:
          errorResponse.error = 'Database Error';
          errorResponse.message = 'A database error occurred';
          errorResponse.statusCode = 500;
      }
      reply.code(errorResponse.statusCode).send(errorResponse);
      return;
    }

    // Fastify errors with status code
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      errorResponse.statusCode = error.statusCode;
      errorResponse.error = error.name || 'Error';
      reply.code(error.statusCode).send(errorResponse);
      return;
    }

    // Default error
    request.log.error(error);
    reply.code(500).send(errorResponse);
  };
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}
