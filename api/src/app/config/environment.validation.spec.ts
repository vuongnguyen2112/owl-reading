import { environmentValidationSchema } from './environment.validation';

const productionSecrets = {
  JWT_ACCESS_SECRET: 'production-access-secret-at-least-32',
  JWT_REFRESH_SECRET: 'production-refresh-secret-at-least-32',
};

describe('environmentValidationSchema', () => {
  it('keeps development defaults for local configuration', () => {
    const { error, value } = environmentValidationSchema.validate({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/owl_reading',
    });

    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.CORS_ORIGINS).toBe(
      'http://localhost:4200,http://localhost:4201',
    );
    expect(value.AUTH_COOKIE_SECURE).toBe(false);
    expect(value.AUTH_LOGIN_RATE_LIMIT_TTL_SECONDS).toBe(60);
    expect(value.AUTH_LOGIN_RATE_LIMIT_MAX).toBe(5);
    expect(value.AUTH_REGISTER_RATE_LIMIT_TTL_SECONDS).toBe(60);
    expect(value.AUTH_REGISTER_RATE_LIMIT_MAX).toBe(3);
    expect(value.AUTH_REFRESH_RATE_LIMIT_TTL_SECONDS).toBe(60);
    expect(value.AUTH_REFRESH_RATE_LIMIT_MAX).toBe(30);
  });

  it('requires explicit CORS origins in production', () => {
    const { error } = environmentValidationSchema.validate({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@db.example.com/owl_reading',
      AUTH_COOKIE_SECURE: true,
      ...productionSecrets,
    });

    expect(error?.message).toContain('"CORS_ORIGINS" is required');
  });

  it('rejects insecure auth cookies in production', () => {
    const { error } = environmentValidationSchema.validate({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@db.example.com/owl_reading',
      CORS_ORIGINS: 'https://reader.example.com,https://admin.example.com',
      AUTH_COOKIE_SECURE: false,
      ...productionSecrets,
    });

    expect(error?.message).toContain(
      '"AUTH_COOKIE_SECURE" must be [true]',
    );
  });

  it('accepts explicit production configuration', () => {
    const { error, value } = environmentValidationSchema.validate({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@db.example.com/owl_reading',
      CORS_ORIGINS: 'https://reader.example.com, https://admin.example.com',
      AUTH_COOKIE_SECURE: true,
      ...productionSecrets,
    });

    expect(error).toBeUndefined();
    expect(value.CORS_ORIGINS).toBe(
      'https://reader.example.com,https://admin.example.com',
    );
  });
});
