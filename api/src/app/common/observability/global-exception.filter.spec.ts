import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('preserves expected HTTP exception response details', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const filter = new GlobalExceptionFilter();

    filter.catch(
      new BadRequestException({
        message: ['title must not be empty'],
        error: 'Bad Request',
      }),
      createHost({ status }),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      timestamp: expect.any(String),
      path: '/api/novels',
      message: ['title must not be empty'],
      error: 'Bad Request',
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"http_exception"'),
      expect.any(String),
    );
  });

  it('hides unexpected exception details from clients', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const filter = new GlobalExceptionFilter();

    filter.catch(new Error('database password leaked'), createHost({ status }));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      timestamp: expect.any(String),
      path: '/api/novels',
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('database password leaked'),
      expect.any(String),
    );
  });
});

function createHost({ status }: { status: jest.Mock }): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        originalUrl: '/api/novels',
        headers: { 'x-request-id': 'request-id' },
      }),
      getResponse: () => ({ status }),
      getNext: jest.fn(),
    }),
  } as unknown as ArgumentsHost;
}
