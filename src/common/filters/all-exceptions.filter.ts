import { Prisma } from '@/generated/prisma/client';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ha ocurrido un error inesperado';
    let code = 'INTERNAL_SERVER_ERROR';

    // HTTP EXCEPTIONS (NestJS)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message =
          ((exceptionResponse as Record<string, unknown>).message as string) ||
          JSON.stringify(exceptionResponse);
        code =
          ((exceptionResponse as Record<string, unknown>).error as string) ||
          'HTTP_EXCEPTION';
      } else {
        message = exceptionResponse;
      }
    }

    // PRISMA EXCEPTIONS
    /* else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      code = prismaError.code;
    } */

    // PRISMA VALIDATION
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Datos de entrada inválidos';
      code = 'VALIDATION_ERROR';
    }

    // GENERIC ERRORS
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log del error
    this.logger.error({
      message,
      status,
      code,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Respuesta al cliente
    response.status(status).json({
      status: 'error',
      code: status,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    });
  }
}
