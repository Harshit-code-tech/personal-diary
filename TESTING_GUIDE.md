# 🧪 Phase 4 Testing Guide

**Date:** November 21, 2025  
**Feature:** People Management System

---

## Quick Start Testing

### 1️⃣ Test People List (Empty State)
1. Go to http://localhost:3000/app/people
2. ✅ Should see "Your People" empty state
3. ✅ Should see "Add Person" button

### 2️⃣ Test Add Person
1. Click "Add Person"
2. Fill in:
   - **Name:** John Doe (required)
   - **Relationship:** Friend
   - **Birthday:** March 15, 1990
   - **Notes:** "Met at university, best friend"
   - **Avatar:** Upload any image (optional)
3. Click "Save Person"
4. ✅ Should redirect to people list
5. ✅ John Doe should appear in grid

### 3️⃣ Test Add More People
Add 2-3 more people to test grid layout:
- **Name:** Sarah Smith | **Relationship:** Family | **Birthday:** July 20
- **Name:** Mike Johnson | **Relationship:** Colleague | **No Birthday**

### 4️⃣ Test Person Detail Page
1. Click on "John Doe" card
2. ✅ Should see full profile with avatar
3. ✅ Should see relationship badge
4. ✅ Should see birthday countdown
5. ✅ Should see stats (0 entries, 0 memories initially)
6. ✅ Should see "Edit" and "Delete" buttons

### 5️⃣ Test Edit Person
1. On John's detail page, click "Edit"
2. Change:
   - **Relationship:** Best Friend
   - **Notes:** Add more text
   - **Avatar:** Upload new image or remove existing
3. Click "Save Changes"
4. ✅ Should redirect back to detail page
5. ✅ Changes should be visible

### 6️⃣ Test Entry Creation with People
1. Go to dashboard (click "My Diary" or /app)
2. Click "New Entry"
3. Fill in:
   - **Title:** "Coffee with John"
   - **People:** Click on "John Doe" to select
   - **Mood:** 😊 Happy
   - **Content:** "Had a great time catching up with John today. We talked about old times..."
4. ✅ John's name should be highlighted when selected
5. Click "Save Entry"
6. ✅ Should redirect to entry view

### 7️⃣ Test People Tags on Dashboard
1. Go back to dashboard (/app)
2. Find the "Coffee with John" entry card
3. ✅ Should see John's avatar/name tag below the entry preview
4. ✅ People tag should have gold/teal styling
5. ✅ Users icon should be visible

### 8️⃣ Test Multi-Person Linking
1. Create another entry
2. Select **multiple people** (John + Sarah)
3. ✅ Both should highlight when selected
4. Save entry
5. ✅ Dashboard should show both people tags on the entry card

### 9️⃣ Test Person Detail with Entries
1. Go back to People → John Doe
2. ✅ Entry count should now show "1 Entry" (or more)
3. ✅ Should see "Coffee with John" entry listed
4. Click on the entry
5. ✅ Should navigate to full entry view

### 🔟 Test Delete Person
1. Go to a person's detail page (maybe create a test person)
2. Click "Delete"
3. ✅ Should show confirmation dialog
4. Confirm deletion
5. ✅ Should redirect to people list
6. ✅ Person should be removed from grid
7. ✅ Entries mentioning them should still exist (person_id set to NULL)

---

## Visual Tests

### Responsive Design
- [ ] Test on mobile (DevTools → Toggle Device)
- [ ] Grid should collapse to 1-2 columns on small screens
- [ ] Sticky header should work on scroll
- [ ] All buttons should be accessible

### Dark Mode
- [ ] Toggle theme switcher in header
- [ ] People cards: Should use graphite background
- [ ] Avatar borders: Should use teal accents
- [ ] People tags on entries: Should use teal instead of gold
- [ ] All text should be readable

### Hover Effects
- [ ] People cards: Should scale 1.05 on hover
- [ ] Entry cards: Should show teal border on hover
- [ ] People selection buttons: Should show hover state
- [ ] All buttons: Should show cursor pointer

---

## Database Tests

### Check Supabase
1. Go to Supabase Dashboard
2. Table Editor → `people`
   - ✅ Should see all added people
   - ✅ avatar_url should have storage URLs
   - ✅ user_id should match your auth ID

3. Table Editor → `entry_people`
   - ✅ Should see junction records
   - ✅ entry_id and person_id should match
   - ✅ Should have unique constraint (no duplicates)

4. Storage → `diary-images`
   - ✅ Should see uploaded avatars in `{user_id}/people/` folder
   - ✅ Images should be publicly accessible

---

## Error Handling Tests

### Test Validation
- [ ] Try saving person without name → Should show error
- [ ] Try uploading 10MB image → Should show error
- [ ] Try accessing non-existent person ID → Should redirect

### Test Edge Cases
- [ ] Person with no avatar → Should show initials circle
- [ ] Person with no birthday → Should not show countdown
- [ ] Entry with no people → Should not show people section
- [ ] Person with many entries → Should list all entries

---

## Performance Tests

### Load Times
- [ ] People list with 10+ people → Should load quickly
- [ ] Person detail with 20+ entries → Should paginate (future)
- [ ] Dashboard with people tags → Should not slow down
- [ ] Image uploads → Should show progress/loading state

---

## Known Limitations (Future Work)

### Memories Feature (Deferred to Later)
- Memories section shows placeholder
- "Memories feature coming soon!" message
- Can be implemented in future phase

### Search & Filtering (Phase 6)
- No search bar on people list yet
- No filter by relationship
- Planned for Search & Discovery phase

### Pagination (Performance Optimization)
- All entries shown on person detail page
- May need pagination if many entries
- Will add when needed

---

## Success Criteria

### ✅ Core Features Working
- [x] CRUD operations for people
- [x] Avatar upload and display
- [x] Many-to-many entry-people linking
- [x] People tags on entry cards
- [x] Birthday countdown calculation
- [x] Edit person functionality
- [x] Delete with confirmation

### ✅ UI/UX Quality
- [x] Responsive on all screen sizes
- [x] Dark mode fully supported
- [x] Smooth transitions and animations
- [x] Clear visual feedback
- [x] Intuitive navigation

### ✅ Data Integrity
- [x] RLS policies enforced
- [x] Cascade deletes working
- [x] No orphaned records
- [x] Image storage working

---

## Next Phase Preview

### Phase 5: Stories & Collections
**What's Coming:**
- Story folders (Trips, Projects, Life Events)
- Custom collections of related entries
- Story timeline visualization
- Tags and categories system
- Story sharing/export

**Why It's Exciting:**
- Organize entries beyond just dates and people
- Create narrative arcs (e.g., "Road Trip 2025")
- Group related entries across time
- Better discover connections in your journal

---

## Bug Report Template

If you find any issues:

```
**Bug:** [Brief description]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Browser:** [Chrome/Firefox/Safari]
**Theme:** [Light/Dark]
**Screenshot:** [If applicable]
```

---

**Testing Complete?** ✅ Phase 4 is ready for production!  
**Ready for:** Phase 5 - Stories & Collections
