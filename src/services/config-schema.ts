import { z } from 'zod';

const MilestoneSchema = z.object({
  name: z.string(),
  date: z.string(),
});

const BranchInfoSchema = z.object({
  title: z.string(),
  branch: z.string(),
  products: z.string(),
});

const FeatureSchema = z.object({
  title: z.string(),
  dev: z.array(z.string()).optional(),
  qa: z.array(z.string()).optional(),
});

const VersionDataSchema = z.object({
  name: z.string(),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  totalDays: z.number().optional().default(0),
  daysLeft: z.number().optional().default(0),
  progress: z.number().optional().default(0),
  milestones: z.array(MilestoneSchema).optional().default([]),
  branches: z.array(BranchInfoSchema).optional().default([]),
});

const DropSchema = z.object({
  id: z.number(),
  name: z.string(),
  date: z.string(),
  status: z.enum(['completed', 'current', 'upcoming']).optional().default('upcoming'),
});

const TeamSchema = z.object({
  name: z.string(),
  iconColor: z.string().optional(),
  features: z.array(z.union([FeatureSchema, z.string()])).optional().default([]),
  borderColor: z.string().optional(),
});

const BirthdaySchema = z.object({
  name: z.string(),
  date: z.string(),
  daysAway: z.number().optional().default(0),
  image: z.string(),
});

export const AppConfigSchema = z.object({
  versionData: VersionDataSchema,
  drops: z.array(DropSchema),
  teams: z.array(TeamSchema),
  birthdays: z.array(BirthdaySchema),
});

export function parseAppConfig(data: unknown): z.infer<typeof AppConfigSchema> {
  return AppConfigSchema.parse(data);
}
