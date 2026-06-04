import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:4200,http://localhost:4201')
    .custom((value: string) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .join(','),
    ),
  ADMIN_API_KEY: Joi.string().min(12).optional(),
  ALLOW_PLACEHOLDER_ADMIN: Joi.boolean().default(false),
});
