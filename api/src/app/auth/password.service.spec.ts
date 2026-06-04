import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes and verifies a password', async () => {
    const hash = await service.hash('password123');

    await expect(service.verify('password123', hash)).resolves.toBe(true);
    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects legacy or malformed hashes', async () => {
    await expect(
      service.verify('password123', 'sha256:not-supported'),
    ).resolves.toBe(false);
  });
});
