import { parseAppConfig } from './config-schema';

describe('Config Schema Validation', () => {
  const validConfig = {
    versionData: {
      name: 'FY26 Q3',
      startDate: '2025-12-21',
      endDate: '2026-03-01',
    },
    drops: [
      { id: 1, name: 'Drop 1', date: '15.01.26', status: 'completed' },
      { id: 2, name: 'Drop 2', date: '15.02.26', status: 'current' },
    ],
    teams: [
      {
        name: 'Team A',
        features: [{ title: 'Feature 1', dev: ['Alice'], qa: ['Bob'] }],
      },
    ],
    birthdays: [
      { name: 'Alice', date: '25/09', image: 'alice.jpg' },
    ],
  };

  it('should accept valid config', () => {
    const result = parseAppConfig(validConfig);
    expect(result.versionData.name).toBe('FY26 Q3');
    expect(result.drops).toHaveLength(2);
    expect(result.teams).toHaveLength(1);
    expect(result.birthdays).toHaveLength(1);
  });

  it('should default optional fields on versionData', () => {
    const result = parseAppConfig(validConfig);
    expect(result.versionData.totalDays).toBe(0);
    expect(result.versionData.daysLeft).toBe(0);
    expect(result.versionData.progress).toBe(0);
    expect(result.versionData.milestones).toEqual([]);
    expect(result.versionData.branches).toEqual([]);
  });

  it('should default daysAway on birthdays', () => {
    const result = parseAppConfig(validConfig);
    expect(result.birthdays[0].daysAway).toBe(0);
  });

  it('should accept teams with string features', () => {
    const config = {
      ...validConfig,
      teams: [{ name: 'Team B', features: ['Feature as string'] }],
    };
    const result = parseAppConfig(config);
    expect(result.teams[0].features[0]).toBe('Feature as string');
  });

  it('should accept teams without optional fields', () => {
    const config = {
      ...validConfig,
      teams: [{ name: 'Team C' }],
    };
    const result = parseAppConfig(config);
    expect(result.teams[0].features).toEqual([]);
    expect(result.teams[0].iconColor).toBeUndefined();
    expect(result.teams[0].borderColor).toBeUndefined();
  });

  it('should reject config missing versionData', () => {
    const { versionData, ...noVersion } = validConfig;
    expect(() => parseAppConfig(noVersion)).toThrow();
  });

  it('should reject config with wrong versionData shape', () => {
    const config = { ...validConfig, versionData: { name: 123 } };
    expect(() => parseAppConfig(config)).toThrow();
  });

  it('should reject invalid drop status', () => {
    const config = {
      ...validConfig,
      drops: [{ id: 1, name: 'Drop 1', date: '15.01.26', status: 'invalid' }],
    };
    expect(() => parseAppConfig(config)).toThrow();
  });

  it('should reject config missing required birthday fields', () => {
    const config = {
      ...validConfig,
      birthdays: [{ name: 'Alice' }], // missing date and image
    };
    expect(() => parseAppConfig(config)).toThrow();
  });

  it('should accept config with milestones and branches', () => {
    const config = {
      ...validConfig,
      versionData: {
        ...validConfig.versionData,
        milestones: [{ name: 'FF', date: 'Feb 22' }],
        branches: [{ title: 'Legacy', branch: 'dev', products: 'P1, P2' }],
      },
    };
    const result = parseAppConfig(config);
    expect(result.versionData.milestones).toHaveLength(1);
    expect(result.versionData.branches).toHaveLength(1);
  });
});
