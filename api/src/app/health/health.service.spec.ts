import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns basic API health information', () => {
    const service = new HealthService();

    expect(service.getHealth()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    });
  });
});
