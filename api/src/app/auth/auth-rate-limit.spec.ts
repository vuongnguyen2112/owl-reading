import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const authResponse = {
  user: {
    id: 'user-id',
    email: 'reader@example.com',
    displayName: 'Test Reader',
    role: 'USER',
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

async function createTestApp(): Promise<INestApplication> {
  const authService = {
    register: jest.fn().mockResolvedValue(authResponse),
    login: jest.fn().mockResolvedValue(authResponse),
    refresh: jest.fn().mockResolvedValue(authResponse),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    getRefreshCookieOptions: jest.fn().mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 1000,
    }),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [
      ThrottlerModule.forRoot({
        throttlers: [
          { name: 'login', ttl: 60000, limit: 2 },
          { name: 'register', ttl: 60000, limit: 2 },
          { name: 'refresh', ttl: 60000, limit: 2 },
        ],
      }),
    ],
    controllers: [AuthController],
    providers: [{ provide: AuthService, useValue: authService }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.listen(0);

  return app;
}

async function postJson(url: string, path: string, body: object): Promise<Response> {
  return fetch(`${url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('AuthController rate limiting', () => {
  let app: INestApplication;
  let url: string;

  beforeEach(async () => {
    app = await createTestApp();
    url = await app.getUrl();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('returns 429 after exceeding the login limit', async () => {
    const body = { email: 'reader@example.com', password: 'password123' };

    expect((await postJson(url, '/auth/login', body)).status).toBe(201);
    expect((await postJson(url, '/auth/login', body)).status).toBe(201);
    expect((await postJson(url, '/auth/login', body)).status).toBe(429);
  });

  it('returns 429 after exceeding the register limit', async () => {
    const body = { email: 'reader@example.com', password: 'password123' };

    expect((await postJson(url, '/auth/register', body)).status).toBe(201);
    expect((await postJson(url, '/auth/register', body)).status).toBe(201);
    expect((await postJson(url, '/auth/register', body)).status).toBe(429);
  });

  it('returns 429 after exceeding the refresh limit', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Cookie: 'owl_refresh_token=refresh-token',
    };

    expect(
      (
        await fetch(`${url}/auth/refresh`, {
          method: 'POST',
          headers,
          body: '{}',
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await fetch(`${url}/auth/refresh`, {
          method: 'POST',
          headers,
          body: '{}',
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await fetch(`${url}/auth/refresh`, {
          method: 'POST',
          headers,
          body: '{}',
        })
      ).status,
    ).toBe(429);
  });
});
