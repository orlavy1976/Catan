// docs/src/config/design.js
// 🎨 Design System - UI Design Tokens & Constants
// Centralized styling constants for consistent UI across the entire application

// ==================== COLORS ====================

// Base Color Palette
export const COLORS = {
  // Primary colors (existing player colors)
  primary: {
    red: 0xd32f2f,
    blue: 0x1976d2, 
    orange: 0xffa000,
    green: 0x388e3c,
  },

  // UI Theme Colors
  background: {
    ocean: 0x5aa0c8,        // Main background (from HTML)
    primary: 0x1f2937,      // Dark panels
    secondary: 0x111827,    // Darker panels
    overlay: 0x000000,      // Modal overlays
  },

  // Text Colors
  text: {
    primary: 0xffffff,      // Main text
    secondary: 0xffffaa,    // Secondary text (yellow tint)
    muted: 0xdddddd,        // Muted text
    success: 0x99ff99,      // Success messages
    error: 0xff6b6b,        // Error messages
    warning: 0xfbbf24,      // Warning messages
  },

  // Resource Colors
  resource: {
    brick: 0xb24d3d,
    wood: 0x2a6e3a,
    wheat: 0xd9bb49,
    sheep: 0x7dbf6a,
    ore: 0x6c707d,
  },

  // UI Element Colors
  ui: {
    border: 0xffffff,
    borderMuted: 0xffffff,
    accent: 0x2563eb,       // Blue accent
    hover: 0x3b82f6,        // Lighter blue for hover
    disabled: 0x6b7280,     // Gray for disabled states
  },

  // Development Card Colors
  devCard: {
    background: 0xfef3c7,   // Light yellow
    border: 0x111827,
    text: 0x111827,
  }
};

// Color opacity/alpha values
export const ALPHA = {
  overlay: 0.5,
  modalBackground: 0.96,
  panelBackground: 0.85,
  hover: 0.8,
  disabled: 0.5,
  subtle: 0.35,
  verySubtle: 0.18,
  minimal: 0.12,
  highlight: 0.25,
  border: 0.12,
  borderStrong: 0.35,
};

// ==================== TYPOGRAPHY ====================

export const TYPOGRAPHY = {
  // Font Families
  fonts: {
    primary: "Georgia, serif",     // Headers, important text
    secondary: "Arial, sans-serif", // Body text, UI elements
  },

  // Font Sizes
  fontSize: {
    xs: 10,   // Very small text
    sm: 12,   // Small text
    base: 14, // Base size
    md: 16,   // Medium text
    lg: 18,   // Large text
    xl: 20,   // Extra large
    xxl: 22,  // Headers
    xxxl: 24, // Large headers
  },

  // Text Styles (commonly used combinations)
  styles: {
    // Headers
    title: {
      fontFamily: "Georgia, serif",
      fontSize: 22,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
    },
    
    subtitle: {
      fontFamily: "Georgia, serif", 
      fontSize: 18,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    },

    // Button text
    button: {
      fontFamily: "Georgia, serif",
      fontSize: 20,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    },

    buttonSmall: {
      fontFamily: "Arial, sans-serif",
      fontSize: 14,
      fill: 0xffffff,
    },

    // Body text
    body: {
      fontFamily: "Arial, sans-serif",
      fontSize: 14,
      fill: 0xdddddd,
    },

    bodySmall: {
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
      fill: 0xdddddd,
    },

    // UI text
    ui: {
      fontFamily: "Arial, sans-serif",
      fontSize: 18,
      fill: 0xffffaa,
    },

    success: {
      fontFamily: "Arial, sans-serif",
      fontSize: 16,
      fill: 0x99ff99,
    },

    // Resource/counter text
    counter: {
      fontFamily: "Georgia, serif",
      fontSize: 14,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    },

    // Player names
    playerName: {
      fontFamily: "Georgia, serif",
      fontSize: 16,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    },
  }
};

// ==================== SPACING & LAYOUT ====================

export const SPACING = {
  // Base spacing units (pixels)
  xs: 4,
  sm: 6,
  base: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Specific use cases
  buttonGap: 10,
  buttonGapLarge: 14,
  panelPadding: 16,
  containerPadding: 20,
  sectionGap: 24,
};

// ==================== DIMENSIONS ====================

export const DIMENSIONS = {
  // Button sizes
  button: {
    height: 56,
    heightSmall: 36,
    heightLarge: 64,
    minWidth: 140,
    defaultWidth: 160,
    wideWidth: 200,
  },

  // Panel sizes
  panel: {
    resourceWidth: 260,
    scoreWidth: 220,
    hudColumnWidth: 200,
    maxPanelHeight: 400,
  },

  // Border radius
  borderRadius: {
    small: 8,
    base: 10,
    medium: 12,
    large: 16,
  },

  // Icon sizes
  icon: {
    small: 16,
    base: 20,
    medium: 22,
    large: 32,
  },

  // Resource icon specific
  resourceIcon: {
    width: 22,
    height: 18,
  },

  // Player badge
  playerBadge: {
    radius: 10,
  },
};

// ==================== EFFECTS & ANIMATIONS ====================

export const EFFECTS = {
  // Shadow/outline effects
  shadow: {
    soft: { width: 1, color: 0x000000, alpha: 0.25 },
    medium: { width: 2, color: 0x000000, alpha: 0.35 },
    strong: { width: 3, color: 0x000000, alpha: 0.5 },
  },

  // Border styles
  border: {
    subtle: { width: 1, color: 0xffffff, alpha: 0.12 },
    normal: { width: 2, color: 0xffffff, alpha: 0.35 },
    strong: { width: 2, color: 0xffffff, alpha: 0.5 },
    accent: { width: 2, color: 0x2563eb, alpha: 1 },
  },

  // Animation durations (milliseconds)
  animation: {
    fast: 150,
    normal: 300,
    slow: 600,
    diceShake: 600,
  },

  // Hover/interaction effects
  hover: {
    scale: 1.05,
    alphaChange: 0.1,
  },
};

// ==================== Z-INDEX LAYERS ====================

export const Z_INDEX = {
  background: 0,
  board: 100,
  buildings: 200,
  ui: 900,
  panels: 1000,
  hud: 2000,
  scorePanel: 4000,
  modals: 10000,
  overlays: 15000,
  tooltips: 20000,
};

// ==================== HELPER FUNCTIONS ====================

// Create commonly used combinations
export const UI_STYLES = {
  // Panel background
  panelBackground: (alpha = ALPHA.panelBackground) => ({
    color: COLORS.background.primary,
    alpha: alpha,
    borderRadius: DIMENSIONS.borderRadius.medium,
    border: EFFECTS.border.subtle,
  }),

  // Modal background
  modalBackground: (alpha = ALPHA.modalBackground) => ({
    color: COLORS.background.secondary,
    alpha: alpha,
    borderRadius: DIMENSIONS.borderRadius.large,
    border: EFFECTS.border.normal,
  }),

  // Button styles
  primaryButton: {
    background: { color: 0xffffff, alpha: ALPHA.minimal },
    border: EFFECTS.border.normal,
    borderRadius: DIMENSIONS.borderRadius.large,
    text: TYPOGRAPHY.styles.button,
  },

  secondaryButton: {
    background: { color: COLORS.ui.accent, alpha: 1 },
    border: EFFECTS.border.subtle,
    borderRadius: DIMENSIONS.borderRadius.small,
    text: TYPOGRAPHY.styles.buttonSmall,
  },

  // Resource chip
  resourceChip: {
    background: { color: 0xffffff, alpha: ALPHA.minimal },
    border: EFFECTS.border.subtle,
    borderRadius: DIMENSIONS.borderRadius.base,
    text: TYPOGRAPHY.styles.buttonSmall,
  },
};

// ==================== UTILITY FUNCTIONS ====================

// Convert hex color to RGB object
export function hexToRgb(hex) {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255,
  };
}

// Create color with alpha
export function withAlpha(color, alpha) {
  return { color, alpha };
}

// Get player color by index
export function getPlayerColor(index) {
  const colors = [
    COLORS.primary.red,
    COLORS.primary.blue, 
    COLORS.primary.orange,
    COLORS.primary.green,
  ];
  return colors[index] || COLORS.ui.disabled;
}

// Get resource color by type
export function getResourceColor(resourceType) {
  return COLORS.resource[resourceType] || COLORS.ui.disabled;
}
