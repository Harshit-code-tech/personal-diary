# Responsive Design Guide - Visual Reference

## 📐 Breakpoint Overview

```
Mobile First Approach:
Base    →    XS     →    SM     →    MD      →    LG      →    XL      →    2XL     →    3XL
0px          475px       640px       768px        1024px       1280px       1536px       1920px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mobile      Small      Phablet     Tablet      Laptop      Desktop      Large         4K
Phones      Phones                                                      Desktop
```

## 🎨 Component Behavior by Breakpoint

### Header Navigation

#### Mobile (< 640px)
```
┌─────────────────────────────┐
│ [📖] My Diary    [🔍][☀️][🔔][≡]│
└─────────────────────────────┘
        ↓ (menu open)
┌─────────────────────────────┐
│ Entries                      │
│ Insights                     │
│ Moods                        │
│ ...                          │
│ ───────────────              │
│ Settings                     │
│ Sign Out                     │
└─────────────────────────────┘
```

#### Tablet (640px - 1279px)
```
┌──────────────────────────────────────────────┐
│ [📖] My Diary      [🔍][☀️][🔔][⚙️][≡][🚪]   │
└──────────────────────────────────────────────┘
        ↓ (hamburger open)
┌──────────────────────────────────────────────┐
│ [📝] Entries      [📊] Insights               │
│ [😊] Moods        [🔔] Reminders              │
│ [⭐] Timeline     [🎯] Goals                  │
│ [👥] People       [📚] Stories                │
│ [📅] Calendar     [📈] Stats                  │
└──────────────────────────────────────────────┘
```

#### Desktop (≥ 1280px)
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [📖] My Diary  [📝]Entries [📊]Insights [😊]Moods ... [🔍][☀️][🔔][⚙️][🚪]         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Main App Layout

#### Mobile (< 1024px)
```
┌─────────────────────────┐
│      Header              │
├─────────────────────────┤
│                          │
│   Main Content           │
│   (Full Width)           │
│                          │
│   [Floating FAB 📂]     │
└─────────────────────────┘

Sidebar: Overlay (slides in from left)
```

#### Desktop (≥ 1024px)
```
┌─────────────────────────────────────────────┐
│             Header                           │
├───────────┬─────────────────────────────────┤
│           │                                  │
│ Sidebar   │    Main Content                 │
│ (Sticky)  │    (Flexible Width)             │
│           │                                  │
│           │                                  │
└───────────┴─────────────────────────────────┘
```

### Statistics Cards Grid

#### Mobile (< 640px)
```
┌──────┬──────┐
│ Card │ Card │
├──────┼──────┤
│ Card │ Card │
├──────┴──────┤
│ Streak (2col)│
└──────────────┘
```

#### Tablet (640px - 1023px)
```
┌──────┬──────┬──────┐
│ Card │ Card │ Card │
├──────┼──────┼──────┤
│ Card │ Streak     │
└──────┴────────────┘
```

#### Desktop (≥ 1280px)
```
┌──────┬──────┬──────┬──────┬────────┐
│ Card │ Card │ Card │ Card │ Streak │
└──────┴──────┴──────┴──────┴────────┘
```

### Entry Cards

#### Mobile
```
┌─────────────────────────────┐
│ Title (1-2 lines)            │
│ [😊] Mood                    │
│                              │
│ Preview text (2 lines)...   │
│                              │
│ [📝] 250w [📁] [👤]         │
│ Date: Nov 24, 2025           │
└─────────────────────────────┘
```

#### Desktop
```
┌────────────────────────────────────────────────┐
│ Title (longer)                    Nov 24, 2025  │
│ [😊] Mood Tag                        10:30 AM   │
│                                                  │
│ Preview text with more context shown here       │
│ across multiple lines for better readability... │
│                                                  │
│ [📝] 250 words [📁] Folder [👤] John Doe [🏷️]│
└────────────────────────────────────────────────┘
```

## 🎯 Responsive Patterns Used

### 1. **Hamburger Menu Pattern**
- **When**: Screen width < 1280px
- **Why**: Too many navigation items for horizontal space
- **How**: Collapsible dropdown with smooth animation

### 2. **Stacked to Horizontal**
```css
/* Mobile */
flex-direction: column;

/* Desktop */
sm:flex-row
```

### 3. **Grid Column Variations**
```css
grid-cols-1          /* Mobile */
sm:grid-cols-2       /* Small devices */
md:grid-cols-3       /* Tablets */
lg:grid-cols-4       /* Laptops */
xl:grid-cols-5       /* Desktops */
```

### 4. **Conditional Rendering**
```tsx
{/* Show on mobile */}
<div className="block lg:hidden">Mobile Only</div>

{/* Show on desktop */}
<div className="hidden lg:block">Desktop Only</div>
```

### 5. **Floating Action Button (FAB)**
- **Mobile**: Bottom-right corner, always accessible
- **Desktop**: Hidden (sidebar always visible)

### 6. **Adaptive Typography**
```css
text-xl              /* Base */
sm:text-2xl         /* Small+ */
lg:text-3xl         /* Large+ */
```

### 7. **Responsive Spacing**
```css
p-4                  /* Base padding */
sm:p-6              /* Small+ */
lg:p-8              /* Large+ */
```

## 🔍 Testing Scenarios

### Mobile Portrait (375px)
- ✅ Logo visible
- ✅ Hamburger menu functional
- ✅ Essential actions accessible
- ✅ Content readable without horizontal scroll
- ✅ Touch targets ≥ 44x44px

### Mobile Landscape (667px)
- ✅ Optimized header height
- ✅ Content fills viewport
- ✅ Navigation accessible

### Tablet Portrait (768px)
- ✅ 2-3 column grids
- ✅ Sidebar overlay
- ✅ Better typography hierarchy

### Tablet Landscape (1024px)
- ✅ Sidebar becomes sticky
- ✅ Multi-column layouts
- ✅ More content visible

### Desktop (1280px+)
- ✅ Full navigation bar
- ✅ Sidebar always visible
- ✅ Maximum information density
- ✅ Optimal layout efficiency

## 💡 Best Practices Applied

1. **Mobile-First CSS**
   - Start with mobile styles
   - Add complexity with `sm:`, `md:`, `lg:` prefixes

2. **Touch-Friendly**
   - Minimum 44x44px touch targets
   - Adequate spacing between interactive elements
   - Swipe-friendly gestures

3. **Performance**
   - CSS transitions (not JavaScript)
   - GPU-accelerated transforms
   - Debounced resize handlers

4. **Accessibility**
   - Keyboard navigation works on all sizes
   - Screen reader announcements
   - Focus management in modals

5. **Visual Hierarchy**
   - Important content first
   - Progressive disclosure
   - Clear visual grouping

## 🎨 Color & Theme Adaptation

All responsive components maintain theme consistency:

- **Light Mode**: Gold accents, paper backgrounds
- **Dark Mode**: Teal accents, midnight backgrounds  
- **Grey Mode**: Neutral, low-contrast palette

Hover states and interactions scale appropriately:
- Desktop: Hover, scale transforms
- Mobile: Active states, tap feedback

## 📱 Common Responsive Utilities

```tsx
// Conditional class names
className={`
  w-full                    // Mobile: full width
  sm:w-auto                // Small+: auto width
  lg:max-w-xl              // Large+: constrained
`}

// Responsive flex
className={`
  flex flex-col            // Mobile: stack
  md:flex-row             // Medium+: horizontal
  lg:items-center         // Large+: centered
`}

// Responsive grid
className={`
  grid gap-4               // Base: single column
  sm:grid-cols-2          // Small: 2 columns
  lg:grid-cols-3          // Large: 3 columns
  xl:gap-6                // XL: larger gaps
`}

// Responsive text
className={`
  text-sm                  // Mobile: small
  sm:text-base            // Small+: base
  lg:text-lg              // Large+: large
`}

// Show/hide
className={`
  hidden                   // Hidden by default
  md:block                // Visible medium+
  lg:inline-flex          // Inline flex large+
`}
```

This comprehensive responsive system ensures a seamless experience across all devices! 🚀
