import { Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { requestLoggingMiddleware } from './request-logging.middleware';

class TestResponse extends EventEmitter {
  statusCode = 204;
  headers = new Map<string, string>();

  setHeader(name: string, value: string): void {
    this.headers.set(name, value);
  }
}

describe('requestLoggingMiddleware', () => {
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('adds a request id and logs structured request completion details', () => {
    const response = new TestResponse();
    const next = jest.fn();

    requestLoggingMiddleware(
      {
        method: 'GET',
        originalUrl: '/api/health/live',
        headers: {
          'x-request-id': 'request-id',
          'user-agent': 'jest',
        },
        socket: {
          remoteAddress: '127.0.0.1',
        },
      } as never,
      response as never,
      next,
    );
    response.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(response.headers.get('x-request-id')).toBe('request-id');
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"http_request"'),
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('"path":"/api/health/live"'),
    );
  });
});
