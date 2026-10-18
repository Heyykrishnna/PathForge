import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').max(100).optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').max(100).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  location: z.string().trim().max(150).nullable().optional(),
  website: z.string().trim().url('Invalid website URL').or(z.literal('')).nullable().optional(),
  githubUrl: z.string().trim().url('Invalid GitHub URL').or(z.literal('')).nullable().optional(),
  linkedinUrl: z.string().trim().url('Invalid LinkedIn URL').or(z.literal('')).nullable().optional()
});

export const educationSchema = z.object({
  institution: z.string().trim().min(1, 'Institution is required').max(200),
  degree: z.string().trim().min(1, 'Degree is required').max(150),
  fieldOfStudy: z.string().trim().min(1, 'Field of study is required').max(150),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean().default(false),
  gpa: z.string().trim().max(10).nullable().optional()
});

export const skillItemSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required').max(100),
  category: z.string().trim().max(50).default('general'),
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate')
});

export const syncSkillsSchema = z.object({
  skills: z.array(skillItemSchema)
});

