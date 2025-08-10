// docs/src/config/materialDesign.js
// 🎨 Material Design System for Catan
// Modern, Material Design inspired design tokens with HD graphics support

// ==================== MATERIAL COLORS ====================

// Material Design 3 inspired color palette
export const MATERIAL_COLORS = {
  // Primary color system (Catan themed blues and greens)
  primary: {
    50: 0xeef7ff,   // Lightest
    100: 0xd9edff,
    200: 0xbcdcff,
    300: 0x8dc5ff,
    400: 0x56a3ff,
    500: 0x2563eb,  // Base primary
    600: 0x1d4ed8,
    700: 0x1e40af,
    800: 0x1e3a8a,
    900: 0x1e3a8a,  // Darkest
  },

  // Secondary color (warm earth tones for Catan theme)
  secondary: {
    50: 0xfef3e2,
    100: 0xfde5b8,
    200: 0xfcd08a,
    300: 0xfab85c,
    400: 0xf59e0b,  // Base secondary
    500: 0xd97706,
    600: 0xb45309,
    700: 0x92400e,
    800: 0x78350f,
    900: 0x451a03,
  },

  // Tertiary (ocean/water theme)
  tertiary: {
    50: 0xf0fdfa,
    100: 0xccfbf1,
    200: 0x99f6e4,
    300: 0x5eead4,
    400: 0x2dd4bf,
    500: 0x14b8a6,  // Base tertiary
    600: 0x0d9488,
    700: 0x0f766e,
    800: 0x115e59,
    900: 0x134e4a,
  },

  // Neutral colors
  neutral: {
    0: 0xffffff,
    50: 0xf8fafc,
    100: 0xf1f5f9,
    200: 0xe2e8f0,
    300: 0xcbd5e1,
    400: 0x94a3b8,
    500: 0x64748b,
    600: 0x475569,
    700: 0x334155,
    800: 0x1e293b,
    900: 0x0f172a,
    950: 0x020617,
  },

  // Semantic colors
  semantic: {
    success: 0x10b981,
    warning: 0xf59e0b,
    error: 0xef4444,
    info: 0x3b82f6,
  },

  // Surface colors (for backgrounds)
  surface: {
    primary: 0x0f172a,      // Main dark surface
    secondary: 0x1e293b,    // Lighter dark surface
    tertiary: 0x334155,     // Cards, modals
    accent: 0x475569,       // Elevated surfaces
    overlay: 0x000000,      // Modal overlays
  },

  // Player colors (enhanced with better contrast)
  player: {
    red: 0xdc2626,     // More vibrant red
    blue: 0x2563eb,    // Classic blue
    orange: 0xea580c,  // Warmer orange
    green: 0x16a34a,   // Forest green
  },

  // Resource colors (more saturated and HD-friendly)
  resource: {
    brick: 0xdc2626,   // Rich red-brown
    wood: 0x16a34a,    // Deep forest green
    wheat: 0xeab308,   // Golden yellow
    sheep: 0x22c55e,   // Fresh green
    ore: 0x6b7280,     // Steel gray
    desert: 0xfbbf24,  // Sandy yellow
  },
};

// ==================== MATERIAL TYPOGRAPHY ====================

export const MATERIAL_TYPOGRAPHY = {
  // Font system
  fonts: {
    brand: '"Inter", "Segoe UI", system-ui, sans-serif',     // Headers, branding
    ui: '"Inter", "Segoe UI", system-ui, sans-serif',        // UI elements
    body: '"Inter", "Segoe UI", system-ui, sans-serif',      // Body text
    mono: '"Fira Code", "Courier New", monospace',           // Code, numbers
  },

  // Type scale (based on Material Design 3)
  scale: {
    display: {
      large: { size: 57, weight: 400, lineHeight: 64 },
      medium: { size: 45, weight: 400, lineHeight: 52 },
      small: { size: 36, weight: 400, lineHeight: 44 },
    },
    headline: {
      large: { size: 32, weight: 400, lineHeight: 40 },
      medium: { size: 28, weight: 400, lineHeight: 36 },
      small: { size: 24, weight: 400, lineHeight: 32 },
    },
    title: {
      large: { size: 22, weight: 400, lineHeight: 28 },
      medium: { size: 16, weight: 500, lineHeight: 24 },
      small: { size: 14, weight: 500, lineHeight: 20 },
    },
    body: {
      large: { size: 16, weight: 400, lineHeight: 24 },
      medium: { size: 14, weight: 400, lineHeight: 20 },
      small: { size: 12, weight: 400, lineHeight: 16 },
    },
    label: {
      large: { size: 14, weight: 500, lineHeight: 20 },
      medium: { size: 12, weight: 500, lineHeight: 16 },
      small: { size: 11, weight: 500, lineHeight: 16 },
    },
  },

  // Pre-defined text styles
  styles: {
    // Game title
    gameTitle: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 32,
      fontWeight: 600,
      fill: MATERIAL_COLORS.neutral[0],
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 2,
    },

    // Section headers
    sectionHeader: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 18,
      fontWeight: 600,
      fill: MATERIAL_COLORS.neutral[100],
    },

    // Button text
    buttonLarge: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 16,
      fontWeight: 500,
      fill: MATERIAL_COLORS.neutral[0],
    },

    buttonMedium: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 500,
      fill: MATERIAL_COLORS.neutral[0],
    },

    buttonSmall: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 12,
      fontWeight: 500,
      fill: MATERIAL_COLORS.neutral[0],
    },

    // Body text
    bodyLarge: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fill: MATERIAL_COLORS.neutral[200],
    },

    bodyMedium: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 400,
      fill: MATERIAL_COLORS.neutral[300],
    },

    // UI labels
    label: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 12,
      fontWeight: 500,
      fill: MATERIAL_COLORS.neutral[400],
    },

    // Numbers and counters
    counter: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      fill: MATERIAL_COLORS.neutral[0],
    },
  },
};

// ==================== MATERIAL SPACING ====================

export const MATERIAL_SPACING = {
  // 4px base unit scale
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// ==================== MATERIAL SHADOWS ====================

export const MATERIAL_SHADOWS = {
  none: null,
  
  // Elevation levels
  elevation1: {
    color: 0x000000,
    alpha: 0.12,
    blur: 2,
    distance: 1,
  },
  
  elevation2: {
    color: 0x000000,
    alpha: 0.16,
    blur: 4,
    distance: 2,
  },
  
  elevation3: {
    color: 0x000000,
    alpha: 0.20,
    blur: 8,
    distance: 3,
  },
  
  elevation4: {
    color: 0x000000,
    alpha: 0.25,
    blur: 12,
    distance: 4,
  },
  
  elevation5: {
    color: 0x000000,
    alpha: 0.30,
    blur: 16,
    distance: 6,
  },
};

// ==================== MATERIAL COMPONENTS ====================

export const MATERIAL_BUTTONS = {
  // Button variants
  filled: {
    background: MATERIAL_COLORS.primary[500],
    backgroundHover: MATERIAL_COLORS.primary[600],
    backgroundPressed: MATERIAL_COLORS.primary[700],
    backgroundDisabled: MATERIAL_COLORS.neutral[700],
    text: MATERIAL_COLORS.neutral[0],
    textDisabled: MATERIAL_COLORS.neutral[500],
    elevation: MATERIAL_SHADOWS.elevation1,
    elevationHover: MATERIAL_SHADOWS.elevation2,
    borderRadius: 20,
    paddingX: 24,
    paddingY: 10,
  },
  
  outlined: {
    background: 'transparent',
    backgroundHover: MATERIAL_COLORS.primary[500],
    backgroundPressed: MATERIAL_COLORS.primary[600],
    backgroundDisabled: 'transparent',
    border: MATERIAL_COLORS.primary[500],
    borderHover: MATERIAL_COLORS.primary[600],
    text: MATERIAL_COLORS.primary[500],
    textHover: MATERIAL_COLORS.neutral[0],
    textDisabled: MATERIAL_COLORS.neutral[500],
    borderRadius: 20,
    borderWidth: 2,
    paddingX: 24,
    paddingY: 10,
  },
  
  text: {
    background: 'transparent',
    backgroundHover: MATERIAL_COLORS.primary[500],
    backgroundPressed: MATERIAL_COLORS.primary[600],
    backgroundDisabled: 'transparent',
    text: MATERIAL_COLORS.primary[500],
    textHover: MATERIAL_COLORS.neutral[0],
    textDisabled: MATERIAL_COLORS.neutral[500],
    borderRadius: 20,
    paddingX: 16,
    paddingY: 10,
  },
  
  floating: {
    background: MATERIAL_COLORS.primary[500],
    backgroundHover: MATERIAL_COLORS.primary[600],
    backgroundPressed: MATERIAL_COLORS.primary[700],
    backgroundDisabled: MATERIAL_COLORS.neutral[700],
    text: MATERIAL_COLORS.neutral[0],
    textDisabled: MATERIAL_COLORS.neutral[500],
    elevation: MATERIAL_SHADOWS.elevation3,
    elevationHover: MATERIAL_SHADOWS.elevation4,
    borderRadius: 28,
    size: 56,
  },
  
  // Size variants
  sizes: {
    small: { height: 32, paddingX: 16, fontSize: 12 },
    medium: { height: 40, paddingX: 20, fontSize: 14 },
    large: { height: 48, paddingX: 24, fontSize: 16 },
  },
};

// ==================== MATERIAL ANIMATIONS ====================

export const MATERIAL_MOTION = {
  // Duration tokens
  duration: {
    instant: 0,
    fast: 100,
    normal: 200,
    slow: 300,
    slower: 400,
    slowest: 500,
  },
  
  // Easing curves
  easing: {
    standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1.0)',
    emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  },
  
  // State changes
  ripple: {
    duration: 600,
    maxRadius: 'auto',
    color: MATERIAL_COLORS.neutral[0],
    alpha: 0.12,
  },
  
  hover: {
    scale: 1.02,
    duration: 150,
  },
  
  press: {
    scale: 0.98,
    duration: 100,
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Create a material elevation style
 */
export function createElevation(level = 1) {
  const shadow = MATERIAL_SHADOWS[`elevation${level}`];
  if (!shadow) return null;
  
  return {
    dropShadow: true,
    dropShadowColor: shadow.color,
    dropShadowAlpha: shadow.alpha,
    dropShadowBlur: shadow.blur,
    dropShadowDistance: shadow.distance,
  };
}

/**
 * Get state color for interactive elements
 */
export function getStateColor(baseColor, state = 'default', alpha = 1) {
  const stateMap = {
    default: baseColor,
    hover: adjustBrightness(baseColor, 0.08),
    pressed: adjustBrightness(baseColor, -0.12),
    disabled: MATERIAL_COLORS.neutral[600],
    focused: baseColor,
  };
  
  return { color: stateMap[state], alpha };
}

/**
 * Adjust color brightness
 */
function adjustBrightness(color, amount) {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  
  const newR = Math.max(0, Math.min(255, r + (amount * 255)));
  const newG = Math.max(0, Math.min(255, g + (amount * 255)));
  const newB = Math.max(0, Math.min(255, b + (amount * 255)));
  
  return (newR << 16) | (newG << 8) | newB;
}

/**
 * Create a material color with opacity
 */
export function withOpacity(color, opacity) {
  return { color, alpha: opacity };
}
