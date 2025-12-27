import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { AppConfig } from '../models';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly configUrl = 'config.json';
  private cache$?: Observable<AppConfig>;

  constructor(private readonly http: HttpClient) {}

  getConfig(): Observable<AppConfig> {
    if (!this.cache$) {
      // Because this is a static asset, cache the response for the session.
      this.cache$ = this.http.get<AppConfig>(this.configUrl, { headers: { 'Cache-Control': 'no-cache' } }).pipe(shareReplay(1));
    }
    return this.cache$;
  }
}