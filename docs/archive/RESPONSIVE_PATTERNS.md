# Responsive Design Patterns - Quick Reference

## Header Pattern

```tsx
<header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-xl">
  <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between max-w-7xl mx-auto gap-3">
    <Link
      href="/app"
      className="group flex items-center gap-2 sm:gap-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 shrink-0"
    >
      <div className="p-2 rounded-lg bg-charcoal/5 dark:bg-white/5 group-hover:bg-gold/10 dark:group-hover:bg-teal/10 transition-colors">
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <span className="font-bold text-sm sm:text-lg hidden xs:inline">Back</span>
    </Link>

    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
      <ThemeSwitcher />
      {/* Optional: Action buttons */}
    </div>
  </div>
</header>
```

### Key Features:
- Sticky positioning with backdrop blur
- Responsive padding: `px-4 sm:px-6`, `py-4 sm:py-5`
- Flexible gaps: `gap-2 sm:gap-3 md:gap-4`
- Hidden "Back" text on xs: `hidden xs:inline`
- Responsive icon sizes: `w-4 h-4 sm:w-5 sm:h-5`

---

## Page Title Pattern

```tsx
<div className="mb-6 sm:mb-8">
  <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-charcoal via-charcoal to-charcoal/70 dark:from-teal dark:via-teal dark:to-teal/70 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight flex items-center gap-3 sm:gap-4">
    <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gold dark:text-teal" />
    Page Title
  </h1>
  <p className="text-sm sm:text-base md:text-lg text-charcoal/70 dark:text-white/70 font-medium">
    Page description text
  </p>
</div>
```

### Scale:
- **Mobile**: 3xl title, w-8 icon, text-sm description
- **Tablet**: 4xl title, w-10 icon, text-base description
- **Desktop**: 5xl title, w-12 icon, text-lg description

---

## Button Pattern

### Primary Action Button
```tsx
<button
  onClick={handleAction}
  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-gold dark:bg-teal text-white dark:text-midnight rounded-xl text-xs sm:text-sm font-bold hover:shadow-xl transition-all"
>
  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
  <span className="hidden xs:inline">Full Label</span>
  <span className="xs:hidden">Short</span>
</button>
```

### Time Range / Filter Buttons
```tsx
<div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3">
  {options.map((option) => (
    <button
      key={option.value}
      onClick={() => setFilter(option.value)}
      className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
        filter === option.value
          ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg scale-105'
          : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10 border border-charcoal/10 dark:border-white/10'
      }`}
    >
      {option.label}
    </button>
  ))}
</div>
```

---

## Card Pattern

### Stat Card
```tsx
<div className="bg-white dark:bg-graphite rounded-2xl p-5 sm:p-6 shadow-xl border border-charcoal/10 dark:border-white/10 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-gold dark:hover:border-teal bg-gradient-to-br from-color/20 to-transparent">
  <div className="flex items-start justify-between mb-4">
    <div className="p-3 rounded-xl bg-color/30 backdrop-blur-sm">
      <Icon className="w-6 h-6 text-color" />
    </div>
    <Sparkles className="w-4 h-4 text-gold dark:text-teal opacity-50" />
  </div>
  <div className="text-2xl sm:text-3xl font-black text-charcoal dark:text-white mb-1">
    {value}
  </div>
  <div className="text-xs sm:text-sm font-medium text-charcoal/60 dark:text-white/60">
    {label}
  </div>
</div>
```

---

## Grid Layouts

### 2-Column Mobile, 4-Column Desktop
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
  {/* Cards */}
</div>
```

### 1-Column Mobile, 2-Column Tablet, 3-Column Desktop
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {/* Cards */}
</div>
```

### 1-Column Mobile, 2-Column Desktop
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
  {/* Cards */}
</div>
```

---

## Progress Bar Pattern

```tsx
<div className="flex items-center gap-3 sm:gap-4">
  <div className="w-20 sm:w-24 text-xs sm:text-sm font-bold text-charcoal dark:text-white">
    {label}
  </div>
  <div className="flex-1 bg-charcoal/10 dark:bg-white/10 rounded-full h-8 sm:h-10 overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-gold to-orange-500 dark:from-teal dark:to-cyan-500 flex items-center justify-end px-3 transition-all duration-500"
      style={{ width: `${percentage}%` }}
    >
      {value > 0 && (
        <span className="text-xs sm:text-sm font-bold text-white">
          {value}
        </span>
      )}
    </div>
  </div>
</div>
```

---

## Container Pattern

```tsx
<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
  {/* Content */}
</main>
```

### Sizes:
- **Small**: `max-w-5xl` - Narrow content (reminders)
- **Medium**: `max-w-6xl` - Standard content (mood, timeline)
- **Large**: `max-w-7xl` - Wide content (goals, statistics, insights)

---

## Spacing Scale

### Padding
- **Mobile**: `px-4`, `py-6`
- **Tablet**: `px-6`, `py-8`
- **Desktop**: Same as tablet

### Gaps
- **XS**: `gap-2`
- **SM**: `gap-3`
- **MD**: `gap-4`
- **LG**: `gap-6`
- **Responsive**: `gap-3 sm:gap-4 md:gap-6`

### Margins
- **Mobile**: `mb-6`
- **Tablet+**: `mb-8`
- **Responsive**: `mb-6 sm:mb-8`

---

## Typography Scale

### Headings
- **H1**: `text-3xl sm:text-4xl md:text-5xl`
- **H2**: `text-2xl sm:text-3xl md:text-4xl`
- **H3**: `text-xl sm:text-2xl md:text-3xl`

### Body Text
- **Small**: `text-xs sm:text-sm`
- **Base**: `text-sm sm:text-base`
- **Large**: `text-base sm:text-lg md:text-xl`

### Font Weights
- **Regular**: `font-medium` (500)
- **Bold**: `font-bold` (700)
- **Black**: `font-black` (900)

---

## Icon Sizes

### Feature Icons (in titles)
- **Mobile**: `w-8 h-8`
- **Tablet**: `w-10 h-10`
- **Desktop**: `w-12 h-12`
- **Class**: `w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12`

### Utility Icons (buttons, cards)
- **Mobile**: `w-4 h-4`
- **Tablet+**: `w-5 h-5`
- **Class**: `w-4 h-4 sm:w-5 sm:h-5`

### Card Icons
- **Standard**: `w-6 h-6`
- **No responsive needed**

---

## Color Classes

### Backgrounds
- **Light Mode**: `bg-white`, `bg-cream`, `bg-gray-50`
- **Dark Mode**: `dark:bg-graphite`, `dark:bg-charcoal`, `dark:bg-midnight`

### Text
- **Primary**: `text-charcoal dark:text-white`
- **Secondary**: `text-charcoal/70 dark:text-white/70`
- **Tertiary**: `text-charcoal/60 dark:text-white/60`

### Accents
- **Gold**: `bg-gold`, `text-gold`, `border-gold`
- **Teal**: `dark:bg-teal`, `dark:text-teal`, `dark:border-teal`

### Gradients
- **Gold**: `from-gold to-orange-500`
- **Teal**: `dark:from-teal dark:to-cyan-500`
- **Purple**: `from-purple-500 to-pink-500`
- **Blue**: `from-blue-500 to-teal-500`

---

## Animation Classes

### Transitions
- **Default**: `transition-all duration-300`
- **Fast**: `transition-all duration-200`
- **Smooth**: `transition-all duration-500`

### Hover Effects
- **Scale**: `hover:scale-105`
- **Shadow**: `hover:shadow-xl`, `hover:shadow-2xl`
- **Border**: `hover:border-gold dark:hover:border-teal`
- **Background**: `hover:bg-gold/10 dark:hover:bg-teal/10`

---

## Accessibility Patterns

### Focus States
```tsx
className="focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal focus:ring-offset-2"
```

### Screen Reader Only
```tsx
<span className="sr-only">Descriptive text for screen readers</span>
```

### ARIA Labels
```tsx
<button aria-label="Add new reminder">
  <Plus className="w-5 h-5" />
</button>
```

---

## Breakpoint Reference

```css
/* Tailwind Default Breakpoints */
xs: 475px   /* Custom breakpoint */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
3xl: 1920px /* 3X large devices (custom) */
```

### Usage Examples:
- Hide on mobile: `hidden sm:block`
- Show on mobile only: `block sm:hidden`
- Change at specific breakpoint: `text-sm md:text-base lg:text-lg`

---

## Testing Viewports

### Desktop
- **1920x1080** - Full HD
- **1440x900** - Standard laptop
- **1280x720** - Minimum desktop

### Tablet
- **1024x768** - iPad landscape
- **768x1024** - iPad portrait
- **834x1194** - iPad Pro portrait

### Mobile
- **414x896** - iPhone 11 Pro Max
- **375x667** - iPhone SE
- **360x640** - Android small

---

## Common Mistakes to Avoid

1. ❌ Forgetting responsive prefixes: `px-6` instead of `px-4 sm:px-6`
2. ❌ Fixed widths on mobile: `w-64` instead of `w-full sm:w-64`
3. ❌ No mobile tap target size: buttons < 44px
4. ❌ Text overflow: Not using `truncate` or proper wrapping
5. ❌ Missing responsive images: `w-full h-auto` for images
6. ❌ Hardcoded heights: Use `min-h-screen` instead of `h-screen`

---

## Performance Tips

1. ✅ Use `backdrop-blur-xl` sparingly (GPU intensive)
2. ✅ Limit CSS transitions to transform and opacity
3. ✅ Use `will-change` for animations
4. ✅ Lazy load images below the fold
5. ✅ Minimize JavaScript on mobile
6. ✅ Use CSS gradients instead of images

---

## Quick Copy-Paste Templates

### Page Wrapper
```tsx
<div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
  {/* Content */}
</div>
```

### Main Container
```tsx
<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
  {/* Content */}
</main>
```

### Section Title
```tsx
<h3 className="text-base sm:text-lg font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
  <Icon className="w-5 h-5 text-gold dark:text-teal" />
  Section Title
</h3>
```

---

**Last Updated**: November 2024
**Status**: Production Ready ✅
