import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

interface PostgresError extends Error {
  code: string;
}

function isPostgresError(e: unknown): e is PostgresError {
  return e instanceof Error && 'code' in e && typeof (e as { code?: unknown }).code === 'string';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object' &&
        'message' in (exceptionResponse as object)
          ? (exceptionResponse as { message: string | string[] }).message
          : exception.message;
    } else if (isPostgresError(exception)) {
      message = exception.message;
      this.logger.error(`Database error [${exception.code}]: ${exception.message}`, exception.stack);
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const body: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }
}
