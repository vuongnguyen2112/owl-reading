import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString('base64url')}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const [algorithm, salt, storedKey] = passwordHash.split(':');

    if (algorithm !== 'scrypt' || !salt || !storedKey) {
      return false;
    }

    const stored = Buffer.from(storedKey, 'base64url');
    const derived = (await scrypt(password, salt, stored.length)) as Buffer;

    return stored.length === derived.length && timingSafeEqual(stored, derived);
  }
}
