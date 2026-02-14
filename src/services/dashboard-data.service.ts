import { Injectable, inject } from '@angular/core';
import { AppConfig, Birthday, Drop, Feature, Team, VersionData } from '../models';
import { DateUtilsService } from './date-utils.service';
import { roundTo, DASHBOARD_CONSTANTS } from './utils.service';

export interface ProcessedConfig {
  versionData: VersionData;
  weeksLeft: number;
  drops: Drop[];
  teams: Team[];
  birthdays: Birthday[];
  upcomingBirthday?: Birthday;
  nextBirthday?: Birthday;
  hasUpcomingBirthday: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly dateUtils = inject(DateUtilsService);

  processConfig(data: AppConfig): ProcessedConfig {
    const versionData = this.calculateVersionData(data.versionData);
    const weeksLeft = Math.max(roundTo(versionData.daysLeft / 7, 1), 0);
    const drops = this.decorateDrops(data.drops);
    const teams = Array.isArray(data.teams)
      ? data.teams.map((team) => this.decorateTeam(team))
      : [];
    const birthdays = this.prepareBirthdays(data.birthdays);
    const upcomingBirthday = birthdays.find(
      (b) => b.daysAway <= DASHBOARD_CONSTANTS.UPCOMING_BIRTHDAY_WINDOW_DAYS
    );
    const hasUpcomingBirthday = Boolean(upcomingBirthday);
    const nextBirthday = birthdays.find((b) => b !== upcomingBirthday);

    return {
      versionData,
      weeksLeft,
      drops,
      teams,
      birthdays,
      upcomingBirthday,
      nextBirthday,
      hasUpcomingBirthday,
    };
  }

  calculateVersionData(versionData: VersionData): VersionData {
    const startDate = new Date(versionData.startDate);
    const endDate = new Date(versionData.endDate);
    const now = new Date();

    const totalDurationMs = Math.max(endDate.getTime() - startDate.getTime(), 0);
    const elapsedMs = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), totalDurationMs);
    const remainingMs = Math.max(endDate.getTime() - now.getTime(), 0);

    const progress = totalDurationMs === 0 ? 0 : Math.round((elapsedMs / totalDurationMs) * 100);
    const totalDays = totalDurationMs === 0 ? 0 : Math.ceil(totalDurationMs / DASHBOARD_CONSTANTS.DAY_IN_MS);
    const daysLeft = remainingMs === 0 ? 0 : Math.ceil(remainingMs / DASHBOARD_CONSTANTS.DAY_IN_MS);

    return {
      ...versionData,
      startDate,
      endDate,
      milestones: Array.isArray(versionData.milestones) ? versionData.milestones : [],
      branches: Array.isArray(versionData.branches) ? versionData.branches : [],
      totalDays,
      daysLeft,
      progress
    };
  }

  prepareBirthdays(birthdays: Birthday[]): Birthday[] {
    if (!Array.isArray(birthdays) || birthdays.length === 0) {
      return [];
    }

    const today = this.dateUtils.startOfDay(new Date());
    const upcoming = birthdays
      .map((birthday) => this.decorateBirthday(birthday, today))
      .filter((birthday): birthday is Birthday => birthday !== undefined)
      .sort((a, b) => a.daysAway - b.daysAway);

    if (upcoming.length === 1) {
      return upcoming;
    }

    if (upcoming.length >= 2) {
      return upcoming.slice(0, 2);
    }

    return [];
  }

  decorateBirthday(birthday: Birthday, today: Date): Birthday | undefined {
    const nextBirthdayDate = this.dateUtils.getNextBirthdayDate(birthday.date, today);
    if (!nextBirthdayDate) {
      return undefined;
    }

    const daysAway = Math.max(this.dateUtils.calculateDaysBetween(today, nextBirthdayDate), 0);
    const displayDate = this.dateUtils.formatBirthdayDate(nextBirthdayDate);

    return { ...birthday, daysAway, date: displayDate };
  }

  decorateDrops(drops: Drop[]): Drop[] {
    if (!Array.isArray(drops)) {
      return [];
    }

    const today = this.dateUtils.startOfDay(new Date());
    const parsed = drops
      .map((drop) => {
        const parsedDate = this.dateUtils.parseDropDate(drop.date);
        return { ...drop, parsedDate };
      })
      .sort((a, b) => {
        if (!a.parsedDate || !b.parsedDate) {
          return 0;
        }
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      });

    const currentIndex = parsed.findIndex((drop) => drop.parsedDate && drop.parsedDate >= today);

    return parsed.map((drop, index) => {
      if (!drop.parsedDate) {
        return drop;
      }

      let status: Drop['status'] = 'upcoming';
      if (currentIndex === -1) {
        status = 'completed';
      } else if (index < currentIndex) {
        status = 'completed';
      } else if (index === currentIndex) {
        status = 'current';
      }

      return {
        ...drop,
        status,
        date: this.dateUtils.formatDropDate(drop.parsedDate)
      };
    });
  }

  decorateTeam(team: Partial<Team>): Team {
    const features = Array.isArray(team.features) ? team.features.map((feature) => this.normalizeFeature(feature)) : [];
    return {
      name: team.name ?? DASHBOARD_CONSTANTS.DEFAULT_TEAM_NAME,
      iconColor: team.iconColor ?? DASHBOARD_CONSTANTS.DEFAULT_TEAM_ICON_COLOR,
      borderColor: team.borderColor ?? DASHBOARD_CONSTANTS.DEFAULT_TEAM_BORDER_COLOR,
      features
    };
  }

  normalizeFeature(feature: Feature | string): Feature {
    if (typeof feature === 'string') {
      return { title: feature, dev: [], qa: [] };
    }

    return {
      title: feature.title,
      dev: Array.isArray(feature.dev) ? feature.dev : [],
      qa: Array.isArray(feature.qa) ? feature.qa : []
    };
  }
}
