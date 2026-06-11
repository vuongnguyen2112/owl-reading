import { Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

interface RequestWithUrl extends IncomingMessage {
  originalUrl?: string;
}

const logger = new Logger('HttpRequest');

export function requestLoggingMiddleware(
  request: RequestWithUrl,
  response: ServerResponse,
  next: () => void,
): void {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);

  response.setHeader('x-request-id', requestId);
  response.on('finish', () => {
    logger.log(
      JSON.stringify({
        event: 'http_request',
        requestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
        userAgent: getHeaderValue(request.headers['user-agent']),
        remoteAddress: request.socket.remoteAddress,
      }),
    );
  });

  next();
}

function getRequestId(headers: IncomingHttpHeaders): string {
  return getHeaderValue(headers['x-request-id']) ?? randomUUID();
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
