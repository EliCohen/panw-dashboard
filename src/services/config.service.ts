import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, retry, shareReplay, throwError } from 'rxjs';
import { AppConfig } from '../models';
import { parseAppConfig } from './config-schema';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly configUrl = 'config.json';
  private cache$?: Observable<AppConfig>;

  constructor(private readonly http: HttpClient) {}

  getConfig(): Observable<AppConfig> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<unknown>(this.configUrl, { headers: { 'Cache-Control': 'no-cache' } })
        .pipe(
          retry({ count: 2, delay: 1000 }),
          map((data) => parseAppConfig(data) as AppConfig),
          catchError((error) => {
            console.error('ConfigService: Failed to load or validate config', error);
            return throwError(() =>
              error instanceof Error ? error : new Error('Failed to load configuration')
            );
          }),
          shareReplay(1)
        );
    }
    return this.cache$;
  }

  clearCache(): void {
    this.cache$ = undefined;
  }
}
