# Complete Implementation Checklist - All Pending Features

## 🚨 WHAT IS CRUD?
**CRUD** = **Create, Read, Update, Delete**
- **Create**: Adding new entries, folders, goals, etc.
- **Read**: Viewing/fetching data
- **Update**: Editing existing data
- **Delete**: Removing data

These are the 4 basic operations for any data management system.

---

## ✅ VERIFIED WORKING (Just Implemented)

### Search Features (ALL VISIBLE & WORKING):
1. ✅ **Search History** - Dropdown shows recent searches
2. ✅ **Search Suggestions** - Auto-complete as you type
3. ✅ **Highlight Terms** - Search query highlighted in yellow/gold
4. ✅ **Folder Location** - Shows "📁 Folder Name" in search results

### Export Features (ALL VISIBLE & WORKING):
1. ✅ **JSON Export** - Purple button with FileJson icon
2. ✅ **CSV Export** - Green button with FileSpreadsheet icon
3. ✅ **Markdown Export** - Blue button (already existed)
4. ✅ **PDF Export** - Red button (already existed)

### Code Splitting (BACKEND - Improves Performance):
1. ✅ **Lazy loaded WYSIWYGEditor** - Loads only when needed
2. ✅ **Lazy loaded MoodCharts** - Loads only on mood page
3. ✅ **Shows "Loading editor..." while loading**

---

## 🔴 HIGH PRIORITY - IMPLEMENT IMMEDIATELY

### 1. INTEGRATE TOAST NOTIFICATIONS IN ALL CRUD ACTIONS

**What**: Show success/error messages when user performs actions
**Where**: Toast component exists at `components/ui/ToastContainer.tsx`
**How**: Use `useToast()` hook

#### Files to Update:

##### A. Entry Actions (`app/(app)/app/entry/[id]/page.tsx`):
```typescript
import { useToast } from '@/components/ui/ToastContainer'

export default function EntryPage() {
  const toast = useToast()
  
  // When saving entry
  const handleSave = async () => {
    try {
      // ... save logic
      toast.success('Entry Saved', 'Your changes have been saved successfully')
    } catch (error) {
      toast.error('Save Failed', 'Could not save your entry. Please try again.')
    }
  }
  
  // When deleting entry
  const handleDelete = async () => {
    try {
      // ... delete logic
      toast.success('Entry Deleted', 'Your entry has been removed')
      router.push('/app')
    } catch (error) {
      toast.error('Delete Failed', 'Could not delete entry')
    }
  }
}
```

##### B. New Entry Page (`app/(app)/app/new/page.tsx`):
```typescript
const handleSubmit = async () => {
  try {
    // ... create logic
    toast.success('Entry Created', 'Your diary entry has been saved')
    router.push(`/app/entry/${data.id}`)
  } catch (error) {
    toast.error('Creation Failed', 'Could not create entry')
  }
}
```

##### C. Folder Actions (`app/(app)/app/page.tsx` and folder components):
```typescript
// Create folder
toast.success('Folder Created', `"${folderName}" has been created`)

// Delete folder
toast.success('Folder Deleted', 'Folder and its contents removed')

// Rename folder
toast.success('Folder Renamed', `Renamed to "${newName}"`)
```

##### D. Goal Actions (`app/(app)/app/goals/page.tsx`):
```typescript
// Create goal
toast.success('Goal Added', 'New goal has been created')

// Complete goal
toast.success('Goal Completed', '🎉 Congratulations on achieving your goal!')

// Delete goal
toast.success('Goal Deleted', 'Goal has been removed')

// Update progress
toast.info('Progress Updated', `Goal is now ${progress}% complete`)
```

##### E. People Actions (`app/(app)/app/people/page.tsx`, `people/new/page.tsx`, `people/[id]/edit/page.tsx`):
```typescript
// Add person
toast.success('Person Added', `${name} has been added to your contacts`)

// Update person
toast.success('Person Updated', 'Contact information has been saved')

// Delete person
toast.success('Person Removed', `${name} has been removed`)
```

##### F. Story Actions (`app/(app)/app/stories/page.tsx`, `stories/new/page.tsx`, `stories/[id]/edit/page.tsx`):
```typescript
// Create story
toast.success('Story Created', `"${title}" is ready to track`)

// Update story
toast.success('Story Updated', 'Your changes have been saved')

// Delete story
toast.success('Story Deleted', 'Story has been removed')

// Add entry to story
toast.success('Added to Story', 'Entry has been linked to this story')
```

##### G. Reminder Actions (`app/(app)/app/reminders/page.tsx`):
```typescript
// Create reminder
toast.success('Reminder Set', `You'll be reminded on ${date}`)

// Complete reminder
toast.success('Reminder Completed', '✓ Marked as done')

// Delete reminder
toast.success('Reminder Deleted', 'Reminder has been removed')
```

##### H. Settings Actions (`app/(app)/app/settings/page.tsx`):
```typescript
// Save settings
toast.success('Settings Saved', 'Your preferences have been updated')

// Export data
toast.success('Export Complete', 'Your data has been downloaded')

// Change password
toast.success('Password Changed', 'Your password has been updated')
```

##### I. Template Actions (`components/templates/TemplateModal.tsx`):
```typescript
// Apply template
toast.success('Template Applied', 'Template content has been loaded')
```

---

### 2. INTEGRATE CONFIRMATION DIALOGS FOR DELETE ACTIONS

**What**: Show "Are you sure?" modal before deleting
**Where**: Dialog component exists at `components/ui/ConfirmDialog.tsx`

#### Files to Update:

##### A. Entry Delete (`app/(app)/app/entry/[id]/page.tsx`):
```typescript
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function EntryPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }
  
  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await supabase.from('entries').delete().eq('id', entryId)
      toast.success('Entry Deleted', 'Your entry has been removed')
      router.push('/app')
    } catch (error) {
      toast.error('Delete Failed', 'Could not delete entry')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  return (
    <>
      {/* Delete button */}
      <button onClick={handleDeleteClick}>
        <Trash2 /> Delete
      </button>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Entry?"
        message="This will permanently delete this entry. This action cannot be undone."
        confirmText="Delete Entry"
        type="danger"
        loading={deleting}
      />
    </>
  )
}
```

##### B. Folder Delete (wherever folder delete happens):
```typescript
<ConfirmDialog
  isOpen={showDeleteFolderDialog}
  onClose={() => setShowDeleteFolderDialog(false)}
  onConfirm={handleDeleteFolder}
  title="Delete Folder?"
  message={`This will delete "${folderName}" and all entries inside it. This action cannot be undone.`}
  confirmText="Delete Folder"
  type="danger"
  loading={deletingFolder}
/>
```

##### C. Goal Delete (`app/(app)/app/goals/page.tsx`):
```typescript
<ConfirmDialog
  isOpen={showDeleteGoalDialog}
  onClose={() => setShowDeleteGoalDialog(false)}
  onConfirm={handleDeleteGoal}
  title="Delete Goal?"
  message="Are you sure you want to delete this goal?"
  confirmText="Delete Goal"
  type="danger"
/>
```

##### D. Person Delete (`app/(app)/app/people/[id]/edit/page.tsx`):
```typescript
<ConfirmDialog
  isOpen={showDeletePersonDialog}
  onClose={() => setShowDeletePersonDialog(false)}
  onConfirm={handleDeletePerson}
  title="Remove Person?"
  message={`Are you sure you want to remove "${personName}" from your contacts?`}
  confirmText="Remove Person"
  type="warning"
/>
```

##### E. Story Delete (`app/(app)/app/stories/[id]/edit/page.tsx`):
```typescript
<ConfirmDialog
  isOpen={showDeleteStoryDialog}
  onClose={() => setShowDeleteStoryDialog(false)}
  onConfirm={handleDeleteStory}
  title="Delete Story?"
  message={`This will delete "${storyTitle}" and unlink all associated entries.`}
  confirmText="Delete Story"
  type="danger"
/>
```

##### F. Reminder Delete (`app/(app)/app/reminders/page.tsx`):
```typescript
<ConfirmDialog
  isOpen={showDeleteReminderDialog}
  onClose={() => setShowDeleteReminderDialog(false)}
  onConfirm={handleDeleteReminder}
  title="Delete Reminder?"
  message="Are you sure you want to delete this reminder?"
  confirmText="Delete Reminder"
  type="warning"
/>
```

---

### 3. ADD BREADCRUMBS FOR FOLDER NAVIGATION

**What**: Show "Home > Parent Folder > Current Folder" path
**Where**: Component exists at `components/folders/FolderBreadcrumbs.tsx`

#### Files to Update:

##### A. Entry Detail Page (`app/(app)/app/entry/[id]/page.tsx`):
```typescript
import FolderBreadcrumbs from '@/components/folders/FolderBreadcrumbs'

export default function EntryPage() {
  const [folderPath, setFolderPath] = useState<any[]>([])
  
  // Fetch folder path
  useEffect(() => {
    if (entry?.folder_id) {
      fetchFolderPath(entry.folder_id)
    }
  }, [entry])
  
  const fetchFolderPath = async (folderId: string) => {
    // Recursive function to get folder hierarchy
    const path = []
    let currentId = folderId
    
    while (currentId) {
      const { data } = await supabase
        .from('folders')
        .select('id, name, icon, parent_id')
        .eq('id', currentId)
        .single()
      
      if (data) {
        path.unshift(data) // Add to beginning
        currentId = data.parent_id
      } else {
        break
      }
    }
    
    setFolderPath(path)
  }
  
  return (
    <div>
      {/* Show breadcrumbs */}
      {folderPath.length > 0 && (
        <FolderBreadcrumbs folders={folderPath} />
      )}
      
      {/* Rest of entry content */}
    </div>
  )
}
```

##### B. Main App Page (`app/(app)/app/page.tsx`):
```typescript
// Show breadcrumbs when viewing folder contents
{currentFolder && (
  <FolderBreadcrumbs folders={folderPath} />
)}
```

---

### 4. ADD AUTO-SAVE INDICATOR TO EDITOR

**What**: Automatically save while typing and show "Saving..." / "Saved" indicator
**Where**: Entry edit pages

#### Files to Update:

##### A. New Entry Page (`app/(app)/app/new/page.tsx`):
```typescript
import { useEffect, useRef, useState } from 'react'

export default function NewEntryPage() {
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Auto-save when content changes
  useEffect(() => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Don't auto-save if no content
    if (!title && !content) {
      setAutoSaveStatus('idle')
      return
    }
    
    // Set status to saving
    setAutoSaveStatus('saving')
    
    // Debounce: wait 2 seconds after user stops typing
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Save draft logic here
        await saveDraft()
        setAutoSaveStatus('saved')
        
        // Reset to idle after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } catch (error) {
        setAutoSaveStatus('idle')
        toast.error('Auto-save Failed', 'Please save manually')
      }
    }, 2000)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, mood, tags]) // Dependencies
  
  const saveDraft = async () => {
    // Save to localStorage or Supabase
    localStorage.setItem('entry-draft', JSON.stringify({
      title,
      content,
      mood,
      tags,
      timestamp: Date.now()
    }))
  }
  
  return (
    <div>
      {/* Auto-save indicator in header */}
      <div className="flex items-center gap-2 text-sm">
        {autoSaveStatus === 'saving' && (
          <span className="text-charcoal/60 dark:text-white/60 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-gold dark:border-teal border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        )}
        {autoSaveStatus === 'saved' && (
          <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
            ✓ Saved
          </span>
        )}
      </div>
      
      {/* Editor content */}
    </div>
  )
}
```

##### B. Entry Edit Page (`app/(app)/app/entry/[id]/page.tsx`):
```typescript
// Same auto-save logic but save to database instead of localStorage
const saveDraft = async () => {
  await supabase
    .from('entries')
    .update({
      title,
      content,
      mood,
      updated_at: new Date().toISOString()
    })
    .eq('id', entryId)
}
```

---

### 5. ADD KEYBOARD SHORTCUTS

**What**: Add Cmd+K for search, Cmd+N for new entry, ESC to close modals
**Where**: Global keyboard handler

#### Create New File: `lib/hooks/useKeyboardShortcuts.ts`

```typescript
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts() {
  const router = useRouter()
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K - Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        router.push('/app/search')
      }
      
      // Cmd+N or Ctrl+N - New Entry
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        router.push('/app/new')
      }
      
      // Cmd+/ or Ctrl+/ - Shortcuts Help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        // Show shortcuts help modal
        document.dispatchEvent(new CustomEvent('show-shortcuts-help'))
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [router])
}
```

#### Update App Layout (`app/(app)/layout.tsx`):
```typescript
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'

export default function AppLayout({ children }) {
  useKeyboardShortcuts() // Enable shortcuts
  
  return (
    <ToastProvider>
      {children}
      <KeyboardShortcutsHelp />
    </ToastProvider>
  )
}
```

---

## 🟡 MEDIUM PRIORITY - IMPLEMENT AFTER HIGH PRIORITY

### 6. IMPLEMENT REACT QUERY FOR CACHING

**What**: Wrap Supabase calls for automatic caching and optimistic updates
**Why**: 30-50% faster perceived performance

#### Install Package:
```bash
npm install @tanstack/react-query
```

#### Setup Query Client (`app/layout.tsx`):
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: true,
      },
    },
  }))
  
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

#### Example Usage (Fetch Entries):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function EntriesPage() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  // Fetch entries with caching
  const { data: entries, isLoading } = useQuery({
    queryKey: ['entries', folderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('entries')
        .select('*')
        .eq('folder_id', folderId)
        .order('entry_date', { ascending: false })
      return data
    }
  })
  
  // Create entry with optimistic update
  const createMutation = useMutation({
    mutationFn: async (newEntry) => {
      const { data } = await supabase
        .from('entries')
        .insert(newEntry)
        .select()
        .single()
      return data
    },
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['entries', folderId])
      
      // Snapshot previous value
      const previousEntries = queryClient.getQueryData(['entries', folderId])
      
      // Optimistically update
      queryClient.setQueryData(['entries', folderId], (old: any) => 
        [...old, { ...newEntry, id: 'temp-' + Date.now() }]
      )
      
      return { previousEntries }
    },
    onError: (err, newEntry, context) => {
      // Rollback on error
      queryClient.setQueryData(['entries', folderId], context.previousEntries)
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries(['entries', folderId])
    }
  })
  
  return (
    <div>
      {isLoading ? <LoadingSkeleton /> : (
        <div>
          {entries?.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 7. ADD PAGINATION / INFINITE SCROLL

**What**: Load entries in batches instead of all at once
**Why**: Faster initial load with large datasets

#### Example with React Query:
```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

export default function EntriesPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['entries'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await supabase
        .from('entries')
        .select('*')
        .range(pageParam, pageParam + 19) // 20 per page
        .order('entry_date', { ascending: false })
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined
    }
  })
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full py-3 bg-gold dark:bg-teal text-white rounded-lg"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

---

## 🟢 LOW PRIORITY - NICE TO HAVE

### 8. RICH EDITOR ENHANCEMENTS

#### A. Code Blocks with Syntax Highlighting
- Install: `npm install @tiptap/extension-code-block-lowlight lowlight`
- Add to WYSIWYGEditor extensions

#### B. Tables Support
- Install: `npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header`

#### C. Slash Commands
- Install: `npm install @tiptap/suggestion`
- Type `/` to show command menu

---

### 9. ANALYTICS ENHANCEMENTS

#### A. Writing Time Tracking
```typescript
// Track how long user spends writing
const [writingStartTime, setWritingStartTime] = useState<number | null>(null)
const [totalWritingTime, setTotalWritingTime] = useState(0)

useEffect(() => {
  // Start timer when editor focused
  const handleFocus = () => setWritingStartTime(Date.now())
  
  // Stop timer when editor blurred
  const handleBlur = () => {
    if (writingStartTime) {
      const timeSpent = Date.now() - writingStartTime
      setTotalWritingTime(prev => prev + timeSpent)
      setWritingStartTime(null)
    }
  }
  
  editorElement?.addEventListener('focus', handleFocus)
  editorElement?.addEventListener('blur', handleBlur)
  
  return () => {
    editorElement?.removeEventListener('focus', handleFocus)
    editorElement?.removeEventListener('blur', handleBlur)
  }
}, [writingStartTime])

// Save to database when unmounting
useEffect(() => {
  return () => {
    if (totalWritingTime > 0) {
      supabase.from('entries').update({
        writing_time_seconds: totalWritingTime / 1000
      }).eq('id', entryId)
    }
  }
}, [totalWritingTime])
```

#### B. Word Count Goals
```typescript
// Show progress bar for daily word goal
const dailyGoal = 500 // words
const todayWordCount = 320 // from entries today
const progress = (todayWordCount / dailyGoal) * 100

<div className="mb-6">
  <div className="flex justify-between mb-2">
    <span>Daily Word Goal</span>
    <span>{todayWordCount} / {dailyGoal} words</span>
  </div>
  <div className="h-2 bg-charcoal/10 dark:bg-white/10 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gold dark:bg-teal transition-all"
      style={{ width: `${Math.min(progress, 100)}%` }}
    />
  </div>
</div>
```

---

## 🤖 CI/CD & AUTOMATION (You'll do this last)

### A. GitHub Actions for Testing
**File**: `.github/workflows/test.yml`

```yaml
name: Run Tests

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run tests
      run: npm run test
    
    - name: Run E2E tests
      run: npm run test:e2e
```

### B. GitHub Actions for Deployment
**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    
    - name: Deploy to Vercel
      run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### C. Cron Jobs for Reminders
**What**: Send email/push notifications for reminders

**Option 1 - Supabase Edge Function**:
```sql
-- Create a scheduled job in Supabase
SELECT cron.schedule(
  'send-reminders',
  '0 9 * * *', -- Every day at 9 AM
  $$
    SELECT send_reminder_emails();
  $$
);
```

**Option 2 - Vercel Cron**:
```typescript
// app/api/cron/reminders/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Fetch reminders due today
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, user:users(email)')
    .eq('reminder_date', new Date().toISOString().split('T')[0])
    .eq('is_completed', false)
  
  // Send emails (using Resend, SendGrid, etc.)
  for (const reminder of reminders) {
    await sendEmail({
      to: reminder.user.email,
      subject: `Reminder: ${reminder.title}`,
      body: reminder.description
    })
  }
  
  return Response.json({ success: true, count: reminders.length })
}
```

**vercel.json**:
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 9 * * *"
  }]
}
```

### D. Lighthouse CI for Performance
**File**: `.github/workflows/lighthouse.yml`

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [ master ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v9
      with:
        urls: |
          https://your-app.vercel.app
          https://your-app.vercel.app/app
          https://your-app.vercel.app/app/new
        uploadArtifacts: true
        temporaryPublicStorage: true
```

---

## 📝 SUMMARY OF ALL PENDING WORK

### Immediate (1-2 days):
1. ✅ Toast integration in all CRUD actions (~15 files)
2. ✅ Confirmation dialogs in delete actions (~6 files)
3. ✅ Breadcrumbs for folder navigation (~2 files)
4. ✅ Auto-save indicator in editor (~2 files)
5. ✅ Keyboard shortcuts (~1 hook file)

### Short-term (3-5 days):
6. ✅ React Query for caching
7. ✅ Pagination/infinite scroll
8. ✅ Word count goals

### Long-term (1-2 weeks):
9. ✅ Rich editor enhancements (code blocks, tables, slash commands)
10. ✅ Analytics enhancements (writing time, most used words)

### DevOps (You'll do last):
11. ✅ GitHub Actions for CI/CD
12. ✅ Cron jobs for reminders
13. ✅ Lighthouse CI for performance monitoring

---

## 📊 EFFORT ESTIMATION

| Task | Lines of Code | Time Estimate | Files Modified |
|------|---------------|---------------|----------------|
| Toast Integration | ~200 | 3 hours | 15 files |
| Confirmation Dialogs | ~300 | 3 hours | 6 files |
| Breadcrumbs | ~150 | 2 hours | 3 files |
| Auto-save | ~100 | 2 hours | 2 files |
| Keyboard Shortcuts | ~80 | 1 hour | 2 files |
| React Query | ~400 | 6 hours | 10 files |
| Pagination | ~150 | 3 hours | 3 files |
| Rich Editor | ~300 | 5 hours | 2 files |
| Analytics | ~250 | 4 hours | 3 files |
| CI/CD Setup | ~200 | 3 hours | 3 files |

**Total**: ~2,130 lines of code, ~32 hours of work

---

*End of Implementation Checklist*
