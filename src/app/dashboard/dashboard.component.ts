import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
// import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
// import { ScrollingModule } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { Birthday, Drop, Team, VersionData } from '../../models';
import { calendarIcon, cakeIcon, checkIcon, chevronIcon, clockIcon, usersIcon, usersMiniIcon } from '../../icons';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, AsyncPipe],
//   imports: [CommonModule, NgClass, LayoutModule, ScrollingModule, AsyncPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  versionData: VersionData = {
    name: 'Loading…',
    startDate: new Date(),
    endDate: new Date(),
    totalDays: 0,
    daysLeft: 0,
    progress: 0,
    milestones: [],
    branches: []
  };

  drops: Drop[] = [];
  teams: Team[] = [];
  birthdays: Birthday[] = [
    { name: '', date: '', daysAway: '', image: '' },
    { name: '', date: '', daysAway: '', image: '' }
  ];

  activeSlide = 0;
  slideIntervalMs = 10000;

  // Inline SVG strings for quick binding in the template.
  readonly calendarIcon = calendarIcon;
  readonly cakeIcon = cakeIcon;
  readonly checkIcon = checkIcon;
  readonly chevronIcon = chevronIcon;
  readonly clockIcon = clockIcon;
  readonly usersIcon = usersIcon;
  readonly usersMiniIcon = usersMiniIcon;

  private rotateHandle?: ReturnType<typeof setInterval>;
  private subscriptions = new Subscription();

  private readonly configService = inject(ConfigService);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    // breakpointObserver: BreakpointObserver
  ) {
    // this.subscriptions.add(
    //   breakpointObserver.observe([Breakpoints.Handset]).subscribe(({ matches }) => {
    //     this.slideIntervalMs = matches ? 7000 : 10000;
    //     this.restartRotation();
    //   })
    // );
  }

  ngOnInit(): void {
    this.loadConfig();
    this.startRotation();
  }

  ngOnDestroy(): void {
    this.stopRotation();
    this.subscriptions.unsubscribe();
  }

  selectSlide(index: number): void {
    this.activeSlide = index;
    this.restartRotation();
  }

  private startRotation(): void {
    if (this.rotateHandle) {
      return;
    }
    this.rotateHandle = setInterval(() => {
      if (this.teams.length > 0) {
        this.activeSlide = (this.activeSlide + 1) % this.teams.length;
        this.cdr.markForCheck();
      }
    }, this.slideIntervalMs);
  }

  private stopRotation(): void {
    if (this.rotateHandle) {
      clearInterval(this.rotateHandle);
      this.rotateHandle = undefined;
    }
  }

  private restartRotation(): void {
    this.stopRotation();
    this.startRotation();
  }

  private loadConfig(): void {
    this.subscriptions.add(
      this.configService.getConfig().subscribe({
        next: (data) => {
          this.versionData = {
            ...data.versionData,
            startDate: new Date(data.versionData.startDate),
            endDate: new Date(data.versionData.endDate),
            milestones: Array.isArray(data.versionData.milestones) ? data.versionData.milestones : [],
            branches: Array.isArray(data.versionData.branches) ? data.versionData.branches : []
          };

          this.drops = Array.isArray(data.drops) ? data.drops : [];
          this.teams = Array.isArray(data.teams) ? data.teams : [];
          this.birthdays = Array.isArray(data.birthdays) && data.birthdays.length >= 2 ? data.birthdays : this.birthdays;
          this.activeSlide = 0;
          this.restartRotation();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load configuration', error);
        }
      })
    );
  }
}