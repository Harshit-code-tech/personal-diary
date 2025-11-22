# 🔧 Issues to Fix - November 22, 2025

## 📁 Folder Navigation Issues

### 1. **Limited Icon Options**
- **Issue**: Create folder modal only has 10 icons, missing people/diary icons
- **Fix**: Add 20+ more icons including: 👥 (people), 📖 (diary), 📝, 💬, 🎯, 🌈, ⭐, 💡, 🎨, etc.
- **File**: `components/folders/FolderNavigation.tsx`

### 2. **Modal Layout Too Compact**
- **Issue**: Create folder modal constrained by sidebar width, looks cramped
- **Fix**: Make modal wider (max-w-md → max-w-xl), add more spacing
- **File**: `components/folders/FolderNavigation.tsx`

### 3. **Color Selection Not Working**
- **Issue**: Selected color not being applied to folders
- **Fix**: Ensure color is properly saved and rendered in folder display
- **Files**: `components/folders/FolderNavigation.tsx`

### 4. **Context Menu Positioning**
- **Issue**: Right-click menu appears "one folder below" instead of at cursor
- **Fix**: Adjust context menu positioning to appear exactly at click coordinates
- **File**: `components/folders/FolderNavigation.tsx`

---

## 🎯 Header Alignment Issues

### 5. **Logo Not Leftmost**
- **Issue**: "My Diary" book icon not aligned to left edge
- **Fix**: Remove left padding/margin, ensure flex-start alignment
- **File**: `app/(app)/app/page.tsx`

### 6. **Nav Items Not Rightmost**
- **Issue**: Navigation items (Theme, Entries, People, etc.) not at right edge
- **Fix**: Adjust header container to use justify-between, remove extra spacing
- **File**: `app/(app)/app/page.tsx`

---

## 🔄 Navigation Issues

### 7. **"All Entries" Not Clickable**
- **Issue**: Clicking "All Entries" doesn't navigate/reveal entries
- **Fix**: Add proper onClick handler to clear folder selection
- **File**: `components/folders/FolderNavigation.tsx`

### 8. **Missing Back Button in Calendar**
- **Issue**: No back navigation from `/app/calendar`
- **Fix**: Add back button in calendar header
- **File**: `app/(app)/app/calendar/page.tsx`

### 9. **Missing Back Button in Settings**
- **Issue**: No back navigation from `/app/settings`
- **Fix**: Add back button in settings header (if page exists)
- **File**: Check if `app/(app)/app/settings/page.tsx` exists

---

## 🎨 Theme Issues

### 10. **"I Am Tired" Theme**
- **Issue**: Need new greyish, low-contrast theme for tired users
- **Requirements**:
  - Muted grey/blue backgrounds (not pure black)
  - Soft contrast text (light grey on dark grey)
  - Minimal bright colors
  - Larger, comfortable typography
  - Simplified UI elements
- **Implementation**: 
  - Add new theme option in `ThemeSwitcher.tsx`
  - Create CSS variables for tired theme
  - Apply to all pages
- **Files**: 
  - `components/theme/ThemeSwitcher.tsx`
  - `app/globals.css`
  - All page components

### 11. **Theme Option Missing in Sub-pages**
- **Issue**: Calendar, People, Stories pages don't show theme switcher
- **Fix**: Add ThemeSwitcher component to all page headers
- **Files**: 
  - `app/(app)/app/calendar/page.tsx`
  - `app/(app)/app/people/page.tsx` (if exists)
  - `app/(app)/app/stories/page.tsx` (if exists)

---

## 📅 Calendar Issues

### 12. **Calendar Legends Not Working**
- **Issue**: Only showing one color instead of mood-based colors
- **Fix**: Implement proper mood color mapping in calendar heatmap
- **File**: `app/(app)/app/calendar/page.tsx` or `components/calendar/CalendarView.tsx`

---

## 📚 Stories Issues

### 13. **Story Color Not Working**
- **Issue**: Story color selection has no visual effect
- **Fix**: Apply story color to story cards/badges
- **Files**: Check stories page and entry display

### 14. **Adding Existing Entries to Stories**
- **Issue**: Can only create new entries within story, not link existing ones
- **Fix**: Add two options:
  1. Upload/link existing entry
  2. Create new entry in story
- **Implementation**: Modal with entry selector + database link
- **Files**: Stories page, need to find the file

---

## 📋 Priority Order

1. **HIGH PRIORITY** (Breaking/UX Critical):
   - Fix context menu positioning (#4)
   - Fix "All Entries" click (#7)
   - Add back buttons (#8, #9)
   - Fix folder colors (#3)

2. **MEDIUM PRIORITY** (Visual/Polish):
   - Header alignment (#5, #6)
   - More folder icons (#1)
   - Modal layout (#2)
   - Calendar legends (#12)

3. **LOW PRIORITY** (Feature Enhancements):
   - "I Am Tired" theme (#10)
   - Theme on sub-pages (#11)
   - Story features (#13, #14)

---

## 🚀 Implementation Plan

### Phase 1: Critical Fixes (30 min)
- Context menu positioning
- "All Entries" handler
- Folder color persistence
- Back buttons

### Phase 2: UI Polish (20 min)
- Header alignment
- More icons
- Better modal layout

### Phase 3: Theme System (40 min)
- "I Am Tired" theme
- Theme switcher on all pages

### Phase 4: Advanced Features (45 min)
- Calendar color legends
- Story entry linking
- Story color display

---

**Total Estimated Time**: 2-3 hours
**Files to Modify**: ~8-10 files
**Database Changes**: None (UI only)
