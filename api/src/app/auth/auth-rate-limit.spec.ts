import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
const allowedOrigin = 'http://localhost:4200';

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
    providers: [
      { provide: AuthService, useValue: authService },
      {
        provide: ConfigService,
        useValue: {
          getOrThrow: jest.fn().mockReturnValue(
            'http://localhost:4200,http://localhost:4201',
          ),
        },
      },
    ],
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
    headers: { 'Content-Type': 'application/json', Origin: allowedOrigin },
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
      Origin: allowedOrigin,
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

describe('AuthController cookie-backed auth source validation', () => {
  let app: INestApplication;
  let url: string;

  beforeEach(async () => {
    app = await createTestApp();
    url = await app.getUrl();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('rejects login requests without an Origin or Referer', async () => {
    const response = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reader@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(403);
  });

  it('rejects login requests from an untrusted Origin', async () => {
    const response = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      body: JSON.stringify({
        email: 'reader@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(403);
  });

  it('allows login requests from an allowed Origin', async () => {
    const response = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: allowedOrigin,
      },
      body: JSON.stringify({
        email: 'reader@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(201);
  });

  it('rejects register requests without an Origin or Referer', async () => {
    const response = await fetch(`${url}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reader@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(403);
  });

  it('rejects register requests from an untrusted Origin', async () => {
    const response = await fetch(`${url}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      body: JSON.stringify({
        email: 'reader@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(403);
  });

  it('allows register requests from an allowed Referer origin', async () => {
    const response = await fetch(`${url}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: `${allowedOrigin}/register`,
      },
      body: JSON.stringify({
        email: 'reader@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(201);
  });

  it('rejects refresh requests without an Origin or Referer', async () => {
    const response = await fetch(`${url}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'owl_refresh_token=refresh-token',
      },
      body: '{}',
    });

    expect(response.status).toBe(403);
  });

  it('rejects refresh requests from an untrusted Origin', async () => {
    const response = await fetch(`${url}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'owl_refresh_token=refresh-token',
        Origin: 'https://evil.example',
      },
      body: '{}',
    });

    expect(response.status).toBe(403);
  });

  it('allows refresh requests from an allowed Referer origin', async () => {
    const response = await fetch(`${url}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'owl_refresh_token=refresh-token',
        Referer: `${allowedOrigin}/novels`,
      },
      body: '{}',
    });

    expect(response.status).toBe(201);
  });

  it('rejects logout requests from an untrusted Origin', async () => {
    const response = await fetch(`${url}/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: 'owl_refresh_token=refresh-token',
        Origin: 'https://evil.example',
      },
    });

    expect(response.status).toBe(403);
  });

  it('allows logout requests from an allowed Origin', async () => {
    const response = await fetch(`${url}/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: 'owl_refresh_token=refresh-token',
        Origin: allowedOrigin,
      },
    });

    expect(response.status).toBe(201);
  });
});
