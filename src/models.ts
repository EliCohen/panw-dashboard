export interface Milestone {
  name: string;
  date: string;
}

export interface BranchInfo {
  title: string;
  branch: string;
  products: string;
}

export interface VersionData {
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  totalDays: number;
  daysLeft: number;
  progress: number;
  milestones: Milestone[];
  branches: BranchInfo[];
}

export interface Drop {
  id: number;
  name: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface Team {
  name: string;
  iconColor: string;
  features: string[];
  borderColor: string;
}

export interface Birthday {
  name: string;
  date: string;
  daysAway: number | string;
  image: string;
}

export interface AppConfig {
  versionData: VersionData;
  drops: Drop[];
  teams: Team[];
  birthdays: Birthday[];
}