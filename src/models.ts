export interface Milestone {
  name: string;
  date: string;
}

export interface BranchInfo {
  title: string;
  branch: string;
  products: string;
}

export interface Feature {
  title: string;
  dev?: string[];
  qa?: string[];
}

export interface RawVersionData {
  name: string;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
  branches: BranchInfo[];
}

export interface VersionData {
  name: string;
  startDate: Date;
  endDate: Date;
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
  features: Feature[];
  borderColor: string;
}

export interface Birthday {
  name: string;
  date: string;
  daysAway: number;
  image: string;
}

export interface AppConfig {
  versionData: RawVersionData;
  drops: Drop[];
  teams: Team[];
  birthdays: Birthday[];
}
