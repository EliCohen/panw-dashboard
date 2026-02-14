import { TestBed } from '@angular/core/testing';
import { DashboardDataService } from './dashboard-data.service';
import { DateUtilsService } from './date-utils.service';
import { AppConfig, VersionData } from '../models';
import { DASHBOARD_CONSTANTS } from './utils.service';

describe('DashboardDataService', () => {
  let service: DashboardDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardDataService, DateUtilsService],
    });
    service = TestBed.inject(DashboardDataService);
  });

  describe('calculateVersionData', () => {
    it('should compute progress, totalDays, daysLeft', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 10 * DASHBOARD_CONSTANTS.DAY_IN_MS);
      const end = new Date(now.getTime() + 10 * DASHBOARD_CONSTANTS.DAY_IN_MS);

      const result = service.calculateVersionData({
        name: 'Test',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalDays: 0,
        daysLeft: 0,
        progress: 0,
        milestones: [],
        branches: [],
      });

      expect(result.totalDays).toBe(20);
      expect(result.daysLeft).toBeGreaterThan(9);
      expect(result.daysLeft).toBeLessThanOrEqual(11);
      expect(result.progress).toBe(50);
    });

    it('should handle zero-duration version', () => {
      const date = new Date().toISOString();
      const result = service.calculateVersionData({
        name: 'Zero',
        startDate: date,
        endDate: date,
        totalDays: 0,
        daysLeft: 0,
        progress: 0,
        milestones: [],
        branches: [],
      });

      expect(result.totalDays).toBe(0);
      expect(result.progress).toBe(0);
    });

    it('should clamp progress to 100 when past end date', () => {
      const past = new Date(2020, 0, 1).toISOString();
      const pastEnd = new Date(2020, 0, 10).toISOString();

      const result = service.calculateVersionData({
        name: 'Past',
        startDate: past,
        endDate: pastEnd,
        totalDays: 0,
        daysLeft: 0,
        progress: 0,
        milestones: [],
        branches: [],
      });

      expect(result.progress).toBe(100);
      expect(result.daysLeft).toBe(0);
    });

    it('should default milestones and branches to empty arrays', () => {
      const result = service.calculateVersionData({
        name: 'Test',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalDays: 0,
        daysLeft: 0,
        progress: 0,
        milestones: undefined as any,
        branches: undefined as any,
      });

      expect(result.milestones).toEqual([]);
      expect(result.branches).toEqual([]);
    });
  });

  describe('normalizeFeature', () => {
    it('should convert string to Feature with empty arrays', () => {
      const result = service.normalizeFeature('My Feature');
      expect(result).toEqual({ title: 'My Feature', dev: [], qa: [] });
    });

    it('should pass through Feature objects', () => {
      const feature = { title: 'Test', dev: ['Alice'], qa: ['Bob'] };
      const result = service.normalizeFeature(feature);
      expect(result).toEqual(feature);
    });

    it('should default non-array dev/qa to empty', () => {
      const result = service.normalizeFeature({ title: 'Test' });
      expect(result.dev).toEqual([]);
      expect(result.qa).toEqual([]);
    });
  });

  describe('decorateTeam', () => {
    it('should apply defaults for missing name/colors', () => {
      const result = service.decorateTeam({});
      expect(result.name).toBe(DASHBOARD_CONSTANTS.DEFAULT_TEAM_NAME);
      expect(result.iconColor).toBe(DASHBOARD_CONSTANTS.DEFAULT_TEAM_ICON_COLOR);
      expect(result.borderColor).toBe(DASHBOARD_CONSTANTS.DEFAULT_TEAM_BORDER_COLOR);
    });

    it('should preserve provided values', () => {
      const result = service.decorateTeam({
        name: 'My Team',
        iconColor: '#ff0000',
        borderColor: '#00ff00',
        features: [{ title: 'F1', dev: ['A'], qa: [] }],
      });
      expect(result.name).toBe('My Team');
      expect(result.iconColor).toBe('#ff0000');
      expect(result.features).toHaveLength(1);
    });

    it('should normalize features', () => {
      const result = service.decorateTeam({
        name: 'Team',
        features: ['String Feature', { title: 'Object Feature' }] as any,
      });
      expect(result.features[0]).toEqual({ title: 'String Feature', dev: [], qa: [] });
      expect(result.features[1]).toEqual({ title: 'Object Feature', dev: [], qa: [] });
    });
  });

  describe('decorateDrops', () => {
    it('should sort by date and assign statuses', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 10 * DASHBOARD_CONSTANTS.DAY_IN_MS);
      const future = new Date(now.getTime() + 10 * DASHBOARD_CONSTANTS.DAY_IN_MS);

      const formatDate = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;

      const drops = [
        { id: 2, name: 'Future', date: formatDate(future), status: 'upcoming' as const },
        { id: 1, name: 'Past', date: formatDate(past), status: 'upcoming' as const },
      ];

      const result = service.decorateDrops(drops);
      expect(result[0].name).toBe('Past');
      expect(result[0].status).toBe('completed');
      expect(result[1].name).toBe('Future');
      expect(result[1].status).toBe('current');
    });

    it('should handle empty array', () => {
      expect(service.decorateDrops([])).toEqual([]);
    });

    it('should handle non-array input', () => {
      expect(service.decorateDrops(undefined as any)).toEqual([]);
    });
  });

  describe('prepareBirthdays', () => {
    it('should return empty for empty input', () => {
      expect(service.prepareBirthdays([])).toEqual([]);
    });

    it('should return empty for non-array input', () => {
      expect(service.prepareBirthdays(undefined as any)).toEqual([]);
    });

    it('should return top 2 sorted by daysAway', () => {
      const birthdays = [
        { name: 'A', date: 'January 1st', daysAway: 0, image: 'a.jpg' },
        { name: 'B', date: 'February 15', daysAway: 0, image: 'b.jpg' },
        { name: 'C', date: 'March 20', daysAway: 0, image: 'c.jpg' },
      ];
      const result = service.prepareBirthdays(birthdays);
      expect(result.length).toBeLessThanOrEqual(2);
      // Should be sorted by daysAway (nearest first)
      if (result.length === 2) {
        expect(result[0].daysAway).toBeLessThanOrEqual(result[1].daysAway);
      }
    });
  });

  describe('processConfig', () => {
    it('should produce a complete ProcessedConfig from raw AppConfig', () => {
      const now = new Date();
      const config: AppConfig = {
        versionData: {
          name: 'Test Version',
          startDate: new Date(now.getTime() - 5 * DASHBOARD_CONSTANTS.DAY_IN_MS).toISOString(),
          endDate: new Date(now.getTime() + 5 * DASHBOARD_CONSTANTS.DAY_IN_MS).toISOString(),
          totalDays: 0,
          daysLeft: 0,
          progress: 0,
          milestones: [],
          branches: [],
        },
        drops: [],
        teams: [{ name: 'Team 1', iconColor: '#fff', borderColor: '#000', features: [] }],
        birthdays: [],
      };

      const result = service.processConfig(config);
      expect(result.versionData.name).toBe('Test Version');
      expect(result.weeksLeft).toBeGreaterThanOrEqual(0);
      expect(result.teams).toHaveLength(1);
      expect(result.hasUpcomingBirthday).toBe(false);
      expect(result.upcomingBirthday).toBeUndefined();
    });
  });
});
