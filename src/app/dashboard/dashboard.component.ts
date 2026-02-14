import { AsyncPipe, CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Birthday, Drop, Team, VersionData } from '../../models';
import { calendarIcon, cakeIcon, checkIcon, chevronIcon, clockIcon, usersIcon, usersMiniIcon } from '../../icons';
import { ConfigService } from '../../services/config.service';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { TimerService } from '../../services/timer.service';
import { DASHBOARD_CONSTANTS } from '../../services/utils.service';
import { VersionHeaderComponent } from './components/version-header/version-header.component';
import { RoadmapComponent } from './components/roadmap/roadmap.component';
import { TeamCarouselComponent } from './components/team-carousel/team-carousel.component';
import { BirthdayCardComponent } from './components/birthday-card/birthday-card.component';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LayoutModule,
    ScrollingModule,
    VersionHeaderComponent,
    RoadmapComponent,
    TeamCarouselComponent,
    BirthdayCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private static readonly TIMER_ROTATE = 'carousel-rotation';
  private static readonly TIMER_WORKOUT = 'workout-reminder';
  private static readonly TIMER_CONFIG_TIMEOUT = 'config-refresh-timeout';
  private static readonly TIMER_CONFIG_INTERVAL = 'config-refresh-interval';

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
  birthdays: Birthday[] = [];
  upcomingBirthday?: Birthday;
  nextBirthday?: Birthday;
  hasUpcomingBirthday = false;

  activeSlide = 0;
  slideIntervalMs: number = DASHBOARD_CONSTANTS.SLIDE_INTERVAL_DESKTOP_MS;
  weeksLeft: number = 0;
  showWorkoutReminder = false;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Inline SVG strings for quick binding in the template.
  readonly calendarIcon: SafeHtml;
  readonly cakeIcon: SafeHtml;
  readonly checkIcon: SafeHtml;
  readonly chevronIcon: SafeHtml;
  readonly clockIcon: SafeHtml;
  readonly usersIcon: SafeHtml;
  readonly usersMiniIcon: SafeHtml;

  private subscriptions = new Subscription();

  private readonly configService = inject(ConfigService);
  private readonly dataService = inject(DashboardDataService);
  private readonly timerService = inject(TimerService);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    breakpointObserver: BreakpointObserver,
    private readonly sanitizer: DomSanitizer
  ) {
    this.calendarIcon = this.sanitizer.bypassSecurityTrustHtml(calendarIcon);
    this.cakeIcon = this.sanitizer.bypassSecurityTrustHtml(cakeIcon);
    this.checkIcon = this.sanitizer.bypassSecurityTrustHtml(checkIcon);
    this.chevronIcon = this.sanitizer.bypassSecurityTrustHtml(chevronIcon);
    this.clockIcon = this.sanitizer.bypassSecurityTrustHtml(clockIcon);
    this.usersIcon = this.sanitizer.bypassSecurityTrustHtml(usersIcon);
    this.usersMiniIcon = this.sanitizer.bypassSecurityTrustHtml(usersMiniIcon);

    this.subscriptions.add(
      breakpointObserver.observe([Breakpoints.Handset]).subscribe(({ matches }) => {
        this.slideIntervalMs = matches
          ? DASHBOARD_CONSTANTS.SLIDE_INTERVAL_MOBILE_MS
          : DASHBOARD_CONSTANTS.SLIDE_INTERVAL_DESKTOP_MS;
        this.restartRotation();
      })
    );
  }

  ngOnInit(): void {
    this.loadConfig();
    this.startRotation();
    this.startWorkoutReminder();
    this.startConfigRefresh();
  }

  ngOnDestroy(): void {
    this.timerService.stopAll();
    this.subscriptions.unsubscribe();
  }

  selectSlide(index: number): void {
    this.activeSlide = index;
    this.restartRotation();
  }

  onSlideSelected(index: number): void {
    this.selectSlide(index);
  }

  private startRotation(): void {
    this.timerService.startInterval(
      DashboardComponent.TIMER_ROTATE,
      () => {
        if (this.teams.length > 0) {
          this.activeSlide = (this.activeSlide + 1) % this.teams.length;
          this.cdr.markForCheck();
        }
      },
      this.slideIntervalMs
    );
  }

  private stopRotation(): void {
    this.timerService.stop(DashboardComponent.TIMER_ROTATE);
  }

  private restartRotation(): void {
    this.stopRotation();
    this.startRotation();
  }

  private startWorkoutReminder(): void {
    this.updateWorkoutReminderVisibility();
    this.timerService.startInterval(
      DashboardComponent.TIMER_WORKOUT,
      () => this.updateWorkoutReminderVisibility(),
      DASHBOARD_CONSTANTS.WORKOUT_REMINDER_CHECK_INTERVAL_MS
    );
  }

  private startConfigRefresh(): void {
    const msUntilMidnight = this.timerService.msUntilMidnight();
    this.timerService.startTimeout(
      DashboardComponent.TIMER_CONFIG_TIMEOUT,
      () => {
        this.reloadConfigForMidnight();
        this.timerService.startInterval(
          DashboardComponent.TIMER_CONFIG_INTERVAL,
          () => this.reloadConfigForMidnight(),
          DASHBOARD_CONSTANTS.DAY_IN_MS
        );
      },
      msUntilMidnight
    );
  }

  private reloadConfigForMidnight(): void {
    this.configService.clearCache();
    this.loadConfig();
  }

  private updateWorkoutReminderVisibility(): void {
    this.showWorkoutReminder = this.timerService.isWorkoutReminderTime();
    this.cdr.markForCheck();
  }

  loadConfig(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.subscriptions.add(
      this.configService.getConfig().subscribe({
        next: (data) => {
          try {
            const result = this.dataService.processConfig(data);
            this.versionData = result.versionData;
            this.weeksLeft = result.weeksLeft;
            this.drops = result.drops;
            this.teams = result.teams;
            this.birthdays = result.birthdays;
            this.upcomingBirthday = result.upcomingBirthday;
            this.hasUpcomingBirthday = result.hasUpcomingBirthday;
            this.nextBirthday = result.nextBirthday;
            this.activeSlide = 0;
            this.restartRotation();
            this.isLoading = false;
            this.cdr.markForCheck();
          } catch (error) {
            this.handleError('Failed to process configuration data', error);
          }
        },
        error: (error) => {
          this.handleError('Failed to load configuration', error);
        }
      })
    );
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    this.cdr.markForCheck();
  }
}
