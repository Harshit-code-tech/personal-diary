// Premium Typography System for Personal Diary — Vintage Journal Edition
// Warm, nostalgic fonts for an authentic journal experience

export const typography = {
  // Main Display Font - Elegant serif for headers and titles
  display: {
    family: '"Playfair Display", "Georgia", serif',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    usage: 'Page titles, hero sections, important headings'
  },

  // Heading Font - Warm, readable serif with journal character
  heading: {
    family: '"Lora", "Crimson Pro", "Georgia", serif',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    usage: 'Section headings, card titles, entry titles'
  },

  // Body Font - Readable serif for a real diary feel
  body: {
    family: '"Source Serif 4", "Georgia", serif',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    usage: 'All body text, diary entries, descriptions'
  },

  // UI Font - Clean sans-serif for buttons, labels, metadata
  ui: {
    family: '"Inter", "SF Pro Display", -apple-system, system-ui, sans-serif',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    usage: 'Buttons, labels, metadata, small UI text'
  },

  // Script Font - Natural handwriting for special touches
  script: {
    family: '"Caveat", "Brush Script MT", cursive',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    usage: 'Logo, quotes, special decorative elements (use sparingly!)'
  },

  // Monospace - For code, dates, technical info
  mono: {
    family: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    usage: 'Code blocks, technical data, timestamps'
  }
}

// Font Size Scale (responsive, harmonious)
export const fontSizes = {
  // Display sizes (titles, hero text)
  display: {
    xl: 'clamp(3rem, 5vw, 4.5rem)',      // 48-72px
    lg: 'clamp(2.5rem, 4vw, 3.5rem)',    // 40-56px
    md: 'clamp(2rem, 3.5vw, 3rem)',      // 32-48px
  },

  // Heading sizes
  heading: {
    h1: 'clamp(1.75rem, 3vw, 2.5rem)',   // 28-40px
    h2: 'clamp(1.5rem, 2.5vw, 2rem)',    // 24-32px
    h3: 'clamp(1.25rem, 2vw, 1.75rem)',  // 20-28px
    h4: 'clamp(1.125rem, 1.5vw, 1.5rem)', // 18-24px
  },

  // Body sizes
  body: {
    xl: '1.25rem',   // 20px - Large body text
    lg: '1.125rem',  // 18px - Comfortable reading
    base: '1rem',    // 16px - Standard
    sm: '0.875rem',  // 14px - Small text
    xs: '0.75rem',   // 12px - Captions
  },

  // Special sizes
  button: '0.9375rem',  // 15px - Button text
  input: '1rem',        // 16px - Input text (prevents zoom on iOS)
}

// Line Heights for readability
export const lineHeights = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.75,
}

// Letter Spacing for elegance
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
}

// Usage Examples & Best Practices
export const typographyUsage = {
  logo: {
    font: typography.script.family,
    size: fontSizes.display.md,
    weight: 600,
    letterSpacing: letterSpacing.wide,
    example: '"Noted." - The app name in natural handwriting'
  },

  pageTitle: {
    font: typography.display.family,
    size: fontSizes.display.lg,
    weight: 700,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeights.tight,
    example: 'Main page titles like "Your Memories"'
  },

  sectionHeading: {
    font: typography.heading.family,
    size: fontSizes.heading.h2,
    weight: 600,
    letterSpacing: letterSpacing.normal,
    lineHeight: lineHeights.snug,
    example: 'Section headers like "On This Day"'
  },

  entryTitle: {
    font: typography.heading.family,
    size: fontSizes.heading.h3,
    weight: 600,
    letterSpacing: letterSpacing.normal,
    lineHeight: lineHeights.snug,
    example: 'Individual entry titles'
  },

  bodyText: {
    font: typography.body.family,
    size: fontSizes.body.lg,
    weight: 400,
    letterSpacing: letterSpacing.normal,
    lineHeight: lineHeights.relaxed,
    example: 'Entry content, descriptions, paragraphs'
  },

  quote: {
    font: typography.script.family,
    size: fontSizes.body.xl,
    weight: 500,
    letterSpacing: letterSpacing.wide,
    lineHeight: lineHeights.loose,
    style: 'italic',
    example: 'Inspirational quotes, pulled quotes from entries'
  },

  metadata: {
    font: typography.ui.family,
    size: fontSizes.body.sm,
    weight: 500,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    example: 'Dates, tags, labels, small info'
  },

  button: {
    font: typography.ui.family,
    size: fontSizes.button,
    weight: 600,
    letterSpacing: letterSpacing.wide,
    example: 'All buttons and CTAs'
  }
}

// Premium Color Psychology — Vintage Journal
export const premiumColors = {
  // Warm, aged parchment & leather palette
  primary: {
    parchment: '#F4E8D1',     // Aged paper background
    sepia: '#8B5E3C',         // Warm leather-brown accent
    ink: '#2C1810',           // Deep ink for text
  },

  // Accent colors for different contexts
  accents: {
    wax: '#A0522D',          // Wax seal sienna
    burgundy: '#722F37',     // Deep burgundy for emphasis
    sage: '#87A96B',         // Calming green for positive actions
    lavender: '#9B88B3',     // Gentle purple for memories
  },

  // Semantic colors (user-friendly)
  semantic: {
    success: '#6BBF59',    // Clear success green
    warning: '#F59E0B',    // Attention-grabbing orange
    error: '#EF4444',      // Obvious error red
    info: '#3B82F6',       // Informative blue
  },

  // Dark mode — Leather & Candlelight
  dark: {
    leather: '#1A110A',      // Deep dark leather
    leatherCard: '#2A1F15',  // Card surface
    leatherHover: '#3D2E20', // Hover states
    amber: '#D4A44F',        // Warm candlelight amber
  }
}

// Export CSS custom properties for use in Tailwind
export function generateFontCSS() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,500&family=Caveat:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    :root {
      /* Font Families */
      --font-display: ${typography.display.family};
      --font-heading: ${typography.heading.family};
      --font-body: ${typography.body.family};
      --font-ui: ${typography.ui.family};
      --font-script: ${typography.script.family};
      --font-mono: ${typography.mono.family};

      /* Premium Colors — Vintage Journal */
      --color-parchment: ${premiumColors.primary.parchment};
      --color-sepia: ${premiumColors.primary.sepia};
      --color-ink: ${premiumColors.primary.ink};
      
      /* Design tokens */
      --letter-spacing-tight: ${letterSpacing.tight};
      --letter-spacing-wide: ${letterSpacing.wide};
      --line-height-relaxed: ${lineHeights.relaxed};
    }

    /* Base typography styles */
    body {
      font-family: var(--font-body);
      font-size: ${fontSizes.body.base};
      line-height: ${lineHeights.normal};
      letter-spacing: ${letterSpacing.normal};
    }

    /* Display text */
    .text-display {
      font-family: var(--font-display);
      font-weight: 700;
      letter-spacing: var(--letter-spacing-tight);
      line-height: ${lineHeights.tight};
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      font-weight: 600;
      letter-spacing: ${letterSpacing.normal};
      line-height: ${lineHeights.snug};
    }

    /* Script for special elements */
    .text-script {
      font-family: var(--font-script);
      font-weight: 500;
      letter-spacing: var(--letter-spacing-wide);
    }

    /* Smooth font rendering */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
  `
}
