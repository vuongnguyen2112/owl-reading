import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface RequestLike {
  method?: string;
  originalUrl?: string;
  url?: string;
  headers?: {
    'x-request-id'?: string | string[];
  };
}

interface ResponseLike {
  status(statusCode: number): {
    json(body: ErrorResponseBody): void;
  };
}

interface ErrorResponseBody {
  statusCode: number;
  timestamp: string;
  path?: string;
  message: string | string[];
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestLike>();
    const response = context.getResponse<ResponseLike>();
    const statusCode = this.getStatusCode(exception);
    const responseBody = this.getResponseBody(exception, statusCode, request);

    this.logger.error(
      JSON.stringify({
        event: 'http_exception',
        requestId: this.getRequestId(request),
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode,
        errorName:
          exception instanceof Error ? exception.name : 'UnknownException',
        message: responseBody.message,
        exceptionMessage:
          exception instanceof Error ? exception.message : String(exception),
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(statusCode).json(responseBody);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getResponseBody(
    exception: unknown,
    statusCode: number,
    request: RequestLike,
  ): ErrorResponseBody {
    const base = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    if (!(exception instanceof HttpException)) {
      return {
        ...base,
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        ...base,
        message: exceptionResponse,
        error: exception.name,
      };
    }

    if (isRecord(exceptionResponse)) {
      return {
        ...base,
        message: getMessage(exceptionResponse),
        error: getError(exceptionResponse),
      };
    }

    return {
      ...base,
      message: exception.message,
      error: exception.name,
    };
  }

  private getRequestId(request: RequestLike): string | undefined {
    const requestId = request.headers?.['x-request-id'];

    return Array.isArray(requestId) ? requestId[0] : requestId;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getMessage(response: Record<string, unknown>): string | string[] {
  const message = response['message'];

  if (
    typeof message === 'string' ||
    (Array.isArray(message) &&
      message.every((item): item is string => typeof item === 'string'))
  ) {
    return message;
  }

  return 'Request failed';
}

function getError(response: Record<string, unknown>): string | undefined {
  const error = response['error'];

  return typeof error === 'string' ? error : undefined;
}
