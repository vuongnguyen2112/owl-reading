import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  CORS_ORIGINS: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default(
      'http://localhost:4200,http://localhost:4201',
    ),
  }).custom((value: string) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .join(','),
  ),
  JWT_ACCESS_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(16).default('development-access-secret'),
  }),
  JWT_REFRESH_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(16).default('development-refresh-secret'),
  }),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().min(60).default(900),
  JWT_REFRESH_TTL_DAYS: Joi.number().integer().min(1).default(30),
  AUTH_LOGIN_RATE_LIMIT_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  AUTH_LOGIN_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(5),
  AUTH_REGISTER_RATE_LIMIT_TTL_SECONDS: Joi.number()
    .integer()
    .min(1)
    .default(60),
  AUTH_REGISTER_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(3),
  AUTH_REFRESH_RATE_LIMIT_TTL_SECONDS: Joi.number()
    .integer()
    .min(1)
    .default(60),
  AUTH_REFRESH_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(30),
  AUTH_COOKIE_SECURE: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().valid(true).required(),
    otherwise: Joi.boolean().default(false),
  }),
  AUTH_COOKIE_SAMESITE: Joi.string()
    .valid('strict', 'lax', 'none')
    .default('lax'),
});
