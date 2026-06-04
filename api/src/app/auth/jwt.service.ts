import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  typ: 'access' | 'refresh';
  jti?: string;
  exp: number;
  iat: number;
}

@Injectable()
export class JwtService {
  sign(
    payload: Omit<JwtPayload, 'exp' | 'iat'>,
    secret: string,
    ttlSeconds: number,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const header = this.encode({ alg: 'HS256', typ: 'JWT' });
    const body = this.encode({
      ...payload,
      iat: now,
      exp: now + ttlSeconds,
    });
    const signature = this.signValue(`${header}.${body}`, secret);

    return `${header}.${body}.${signature}`;
  }

  verify(token: string, secret: string, type: JwtPayload['typ']): JwtPayload {
    const [header, body, signature] = token.split('.');

    if (!header || !body || !signature) {
      throw new UnauthorizedException('Token is malformed.');
    }

    const expectedSignature = this.signValue(`${header}.${body}`, secret);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      throw new UnauthorizedException('Token signature is invalid.');
    }

    let payload: JwtPayload;

    try {
      payload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8'),
      ) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Token payload is invalid.');
    }

    if (payload.typ !== type) {
      throw new UnauthorizedException('Token type is invalid.');
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token is expired.');
    }

    return payload;
  }

  private encode(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private signValue(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}
