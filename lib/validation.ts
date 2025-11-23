import { z } from 'zod'

// Entry validation schema
export const entrySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content is too long'),
  mood: z.string().optional().nullable(),
  entry_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  folder_id: z.string().uuid('Invalid folder ID').optional().nullable(),
})

export type EntryFormData = z.infer<typeof entrySchema>

// Folder validation schema
export const folderSchema = z.object({
  name: z.string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters'),
  icon: z.string()
    .min(1, 'Icon is required')
    .max(10, 'Icon must be a single emoji'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be hex color)'),
  parent_id: z.string().uuid().optional().nullable(),
})

export type FolderFormData = z.infer<typeof folderSchema>

// Person validation schema
export const personSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  relationship: z.string()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship must be less than 50 characters'),
  birthday: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable(),
  avatar_url: z.string().url('Invalid URL').optional().nullable(),
})

export type PersonFormData = z.infer<typeof personSchema>

// Story validation schema
export const storySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  icon: z.string()
    .max(10, 'Icon must be a single emoji')
    .default('📖'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be hex color)')
    .default('#D4AF37'),
  category: z.string()
    .max(50, 'Category must be less than 50 characters')
    .optional()
    .nullable(),
  status: z.enum(['ongoing', 'completed', 'archived'])
    .default('ongoing'),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
})

export type StoryFormData = z.infer<typeof storySchema>

// Settings validation
export const settingsSchema = z.object({
  email: z.string().email('Invalid email address'),
  theme: z.enum(['light', 'dark', 'grey']),
})

export type SettingsFormData = z.infer<typeof settingsSchema>

// Helper function to format validation errors
export const formatZodErrors = (error: z.ZodError): Record<string, string> => {
  const formattedErrors: Record<string, string> = {}
  error.issues.forEach((err) => {
    if (err.path.length > 0) {
      formattedErrors[err.path[0].toString()] = err.message
    }
  })
  return formattedErrors
}
