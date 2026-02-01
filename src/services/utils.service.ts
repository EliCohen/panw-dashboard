export function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Constants for dashboard configuration
 */
export const DASHBOARD_CONSTANTS = {
  // Time intervals
  DAY_IN_MS: 1000 * 60 * 60 * 24,
  WORKOUT_REMINDER_CHECK_INTERVAL_MS: 30000, // 30 seconds
  
  // Workout reminder configuration
  WORKOUT_START_MINUTES: 705, // 11:45 AM (11 * 60 + 45)
  WORKOUT_END_MINUTES: 720, // 12:00 PM (12 * 60)
  WORKOUT_WEEKDAYS: [0, 1, 2, 3, 4] as const, // Sunday-Thursday (Sunday = 0)
  
  // Carousel configuration
  SLIDE_INTERVAL_DESKTOP_MS: 10000, // 10 seconds
  SLIDE_INTERVAL_MOBILE_MS: 7000, // 7 seconds
  
  // Birthday configuration
  UPCOMING_BIRTHDAY_WINDOW_DAYS: 7,
  
  // Default values
  DEFAULT_TEAM_ICON_COLOR: '#60a5fa',
  DEFAULT_TEAM_BORDER_COLOR: 'rgba(96, 165, 250, 0.5)',
  DEFAULT_TEAM_NAME: 'Unnamed Team'
} as const;