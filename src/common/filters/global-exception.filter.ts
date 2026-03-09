import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const body = this.buildResponse(exception, req);

    if (body.statusCode >= 500) {
      this.logger.error(
        `[${req.method}] ${req.url} → ${body.statusCode}: ${JSON.stringify(body.message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${req.method}] ${req.url} → ${body.statusCode}: ${JSON.stringify(body.message)}`);
    }

    res.status(body.statusCode).json(body);
  }

  private buildResponse(exception: unknown, req: Request): ErrorResponseBody {
    const timestamp = new Date().toISOString();
    const path = req.url;

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, timestamp, path);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaKnownError(exception, timestamp, path);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Ungültige Anfrage',
        message: 'Die übermittelten Daten sind ungültig.',
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      timestamp,
      path,
    };
  }

  private fromHttpException(ex: HttpException, timestamp: string, path: string): ErrorResponseBody {
    const status = ex.getStatus();
    const response = ex.getResponse();

    if (typeof response === 'string') {
      return { statusCode: status, error: this.statusLabel(status), message: response, timestamp, path };
    }

    const res = response as Record<string, unknown>;
    return {
      statusCode: status,
      error: (res.error as string) ?? this.statusLabel(status),
      message: (res.message as string | string[]) ?? ex.message,
      timestamp,
      path,
    };
  }

  private fromPrismaKnownError(
    error: Prisma.PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
  ): ErrorResponseBody {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[])?.join(', ') ?? 'Feld';
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Konflikt',
          message: `Ein Eintrag mit diesem Wert für "${target}" existiert bereits.`,
          timestamp,
          path,
        };
      }
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Nicht gefunden',
          message: 'Der angeforderte Datensatz wurde nicht gefunden.',
          timestamp,
          path,
        };
      case 'P2003': {
        const field = (error.meta?.field_name as string) ?? 'Referenz';
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Ungültige Referenz',
          message: `Die Referenz "${field}" verweist auf einen nicht existierenden Datensatz.`,
          timestamp,
          path,
        };
      }
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Datenbankfehler',
          message: 'Ein unerwarteter Datenbankfehler ist aufgetreten.',
          timestamp,
          path,
        };
    }
  }

  private statusLabel(status: number): string {
    const labels: Record<number, string> = {
      400: 'Ungültige Anfrage',
      401: 'Nicht autorisiert',
      403: 'Zugriff verweigert',
      404: 'Nicht gefunden',
      409: 'Konflikt',
      422: 'Validierungsfehler',
      429: 'Zu viele Anfragen',
      500: 'Interner Serverfehler',
    };
    return labels[status] ?? 'Fehler';
  }
}

