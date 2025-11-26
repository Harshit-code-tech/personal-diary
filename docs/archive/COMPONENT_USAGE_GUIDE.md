# Quick Start Guide - New Components

## 🔔 Using Toast Notifications

### Import the hook:
```tsx
'use client'

import { useToast } from '@/components/ui/ToastContainer'

function MyComponent() {
  const toast = useToast()
  
  // ... your component logic
}
```

### Usage Examples:

#### Success Toast
```tsx
const handleSave = async () => {
  try {
    await saveEntry(data)
    toast.success('Entry saved', 'Your changes have been saved successfully')
  } catch (error) {
    toast.error('Save failed', error.message)
  }
}
```

#### Error Toast
```tsx
toast.error('Delete failed', 'Unable to delete entry. Please try again.')
```

#### Info Toast
```tsx
toast.info('New feature', 'Check out the new calendar view!')
```

#### Warning Toast
```tsx
toast.warning('Unsaved changes', 'You have unsaved changes. Save before leaving?')
```

#### Custom Duration
```tsx
toast.success('Quick message', 'This will dismiss in 3 seconds', 3000)
```

---

## ⚠️ Using Confirmation Dialog

### Import the component:
```tsx
'use client'

import { useState } from 'react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // ... rest of component
}
```

### Basic Usage (Delete Entry):
```tsx
<ConfirmDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  onConfirm={async () => {
    setLoading(true)
    try {
      await deleteEntry(entryId)
      toast.success('Entry deleted')
      setShowDialog(false)
    } catch (error) {
      toast.error('Delete failed', error.message)
    } finally {
      setLoading(false)
    }
  }}
  title="Delete Entry?"
  message="This action cannot be undone. Are you sure you want to delete this entry?"
  confirmText="Delete"
  cancelText="Cancel"
  type="danger"
  loading={loading}
/>
```

### Warning Dialog (Discard Changes):
```tsx
<ConfirmDialog
  isOpen={showDiscardDialog}
  onClose={() => setShowDiscardDialog(false)}
  onConfirm={() => {
    // Reset form
    resetForm()
    setShowDiscardDialog(false)
  }}
  title="Discard Changes?"
  message="You have unsaved changes. Are you sure you want to discard them?"
  confirmText="Discard"
  type="warning"
/>
```

### Info Dialog (Confirmation):
```tsx
<ConfirmDialog
  isOpen={showExportDialog}
  onClose={() => setShowExportDialog(false)}
  onConfirm={async () => {
    await exportData()
    setShowExportDialog(false)
  }}
  title="Export All Entries?"
  message="This will export all your entries to a JSON file. Continue?"
  confirmText="Export"
  type="info"
/>
```

### Complete Example (Delete Button with Toast):
```tsx
'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContainer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'

export default function DeleteEntryButton({ entryId }: { entryId: string }) {
  const [showDialog, setShowDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const supabase = createClient()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId)
      
      if (error) throw error
      
      toast.success('Entry deleted', 'The entry has been permanently deleted')
      setShowDialog(false)
      // Optionally redirect or refresh
    } catch (error) {
      toast.error('Delete failed', 'Unable to delete entry. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        aria-label="Delete entry"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDelete}
        title="Delete Entry?"
        message="This action cannot be undone. Are you sure you want to delete this entry?"
        confirmText="Delete"
        type="danger"
        loading={deleting}
      />
    </>
  )
}
```

---

## 📋 Common Patterns

### Pattern 1: Create with Success Toast
```tsx
const handleCreate = async () => {
  try {
    const { data } = await supabase.from('entries').insert(newEntry)
    toast.success('Entry created', 'Your new entry has been saved')
    router.push(`/app/entry/${data.id}`)
  } catch (error) {
    toast.error('Create failed', error.message)
  }
}
```

### Pattern 2: Update with Success Toast
```tsx
const handleUpdate = async () => {
  try {
    await supabase.from('entries').update(updates).eq('id', id)
    toast.success('Changes saved')
  } catch (error) {
    toast.error('Update failed', error.message)
  }
}
```

### Pattern 3: Delete with Confirmation + Toast
```tsx
const handleDelete = async () => {
  setShowDialog(true)
}

// In ConfirmDialog onConfirm:
onConfirm={async () => {
  setDeleting(true)
  try {
    await supabase.from('entries').delete().eq('id', id)
    toast.success('Entry deleted')
    setShowDialog(false)
    router.push('/app')
  } catch (error) {
    toast.error('Delete failed', error.message)
  } finally {
    setDeleting(false)
  }
}}
```

### Pattern 4: Network Error Handling
```tsx
try {
  const response = await fetch('/api/export')
  if (!response.ok) throw new Error('Export failed')
  toast.success('Export complete', 'Your data has been exported')
} catch (error) {
  if (error.message.includes('network')) {
    toast.error('Network error', 'Please check your internet connection')
  } else {
    toast.error('Export failed', error.message)
  }
}
```

---

## 🎨 Styling Tips

### Toast Colors (Built-in):
- **Success**: Green background with checkmark icon
- **Error**: Red background with alert icon
- **Info**: Blue background with info icon
- **Warning**: Amber background with warning icon

### Dialog Types (Built-in):
- **Danger**: Red confirm button (for deletions)
- **Warning**: Amber confirm button (for discards)
- **Info**: Blue confirm button (for confirmations)

### Custom Icons (Optional):
```tsx
import { Heart } from 'lucide-react'

<ConfirmDialog
  icon={<Heart className="w-6 h-6 text-pink-500" />}
  // ... other props
/>
```

---

## ✅ Best Practices

1. **Always show loading state** in dialogs for async operations
2. **Use descriptive titles and messages** for clarity
3. **Show success toasts** for all successful actions
4. **Show error toasts** with helpful error messages
5. **Use confirmation dialogs** for all destructive actions
6. **Keep toast messages concise** (title + optional message)
7. **Use appropriate dialog types** (danger for delete, warning for discard)

---

## 🐛 Troubleshooting

### Toast not showing?
- Make sure `ToastProvider` is in `app/(app)/layout.tsx`
- Check you're calling `useToast()` inside a client component ('use client')

### Dialog not closing?
- Ensure `onClose` is called after async operations complete
- Check `loading` state is set back to false

### TypeScript errors?
- Import types: `import { ToastType } from '@/components/ui/Toast'`
- Import dialog props: `import { ConfirmDialogProps } from '@/components/ui/ConfirmDialog'`

---

Ready to use! 🚀
