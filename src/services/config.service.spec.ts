import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  const validConfig = {
    versionData: {
      name: 'FY26 Q3',
      startDate: '2025-12-21',
      endDate: '2026-03-01',
    },
    drops: [
      { id: 1, name: 'Drop 1', date: '15.01.26', status: 'completed' },
    ],
    teams: [
      { name: 'Team A', features: [{ title: 'Feature 1' }] },
    ],
    birthdays: [
      { name: 'Alice', date: '25/09', image: 'alice.jpg' },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ConfigService],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch and validate config', () => {
    service.getConfig().subscribe((config) => {
      expect(config.versionData.name).toBe('FY26 Q3');
      expect(config.drops).toHaveLength(1);
      expect(config.teams).toHaveLength(1);
    });

    const req = httpMock.expectOne('config.json');
    expect(req.request.headers.get('Cache-Control')).toBe('no-cache');
    req.flush(validConfig);
  });

  it('should cache the result', () => {
    service.getConfig().subscribe();
    service.getConfig().subscribe();

    const requests = httpMock.match('config.json');
    expect(requests.length).toBe(1);
    requests[0].flush(validConfig);
  });

  it('should clearCache and refetch', () => {
    service.getConfig().subscribe();
    const req1 = httpMock.expectOne('config.json');
    req1.flush(validConfig);

    service.clearCache();

    service.getConfig().subscribe();
    const req2 = httpMock.expectOne('config.json');
    req2.flush(validConfig);
  });

  it('should error on invalid config shape', () => {
    service.getConfig().subscribe({
      error: (error) => {
        expect(error).toBeInstanceOf(Error);
      },
    });

    // Need to handle retries: flush error 3 times (initial + 2 retries)
    const req = httpMock.expectOne('config.json');
    req.flush({ invalid: true }); // This will pass HTTP but fail Zod validation
  });
});
