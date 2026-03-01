import { z } from 'zod';

const emailSchema = z.string().trim().email('Invalid email format');
const passwordSchema = z
  .string()
  .min(6, 'Password should be at least 6 characters')
  .max(128, 'Password is too long');

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(120, 'Title is too long');

const descriptionSchema = z
  .string()
  .trim()
  .max(500, 'Description is too long')
  .optional();

const todoFilterSchema = z.enum(['all', 'active', 'completed']);

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Tag is required')
  .max(32, 'Tag is too long');

const tagsSchema = z.array(tagSchema).max(10, 'Too many tags').optional();

const deadlineSchema = z.iso.datetime().nullable().optional();

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const createTodoSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  tags: tagsSchema,
  deadline: deadlineSchema,
});

export const updateTodoSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema,
    completed: z.boolean().optional(),
    tags: tagsSchema,
    deadline: deadlineSchema,
  })
  .refine(
    data =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.completed !== undefined ||
      data.tags !== undefined ||
      data.deadline !== undefined,
    { message: 'At least one field is required' }
  );

export const todoListQuerySchema = z.object({
  filter: todoFilterSchema.optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(0).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().max(100, 'Name is too long').optional(),
  bio: z.string().trim().max(500, 'Bio is too long').optional(),
});

export const formatZodErrors = (issues: z.core.$ZodIssue[]) => issues.map(issue => issue.message);
