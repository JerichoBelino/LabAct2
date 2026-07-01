// Theme tokens for VisionAI
// Sleek Material Dark Purple design with modern visual hierarchy

export const COLORS = {
  // Base backgrounds
  background: '#120B24',
  cardBackground: '#1D1438',
  overlay: 'rgba(18, 11, 36, 0.8)',
  glassEffect: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(168, 85, 247, 0.2)',

  // Brand Accents
  primary: '#A855F7',      // Bright Purple
  primaryLight: '#C084FC', // Light Purple
  primaryDark: '#7E22CE',  // Deep Purple
  accent: '#E9D5FF',       // Soft Lavender

  // Neutral Text
  text: '#F3F4F6',          // Off-white
  textMuted: '#9CA3AF',     // Gray 400
  textDark: '#111827',      // Gray 900

  // Statuses
  success: '#10B981',      // Emerald Green
  error: '#EF4444',        // Red
  warning: '#F59E0B',      // Amber
  info: '#3B82F6',         // Blue
};

export const SIZES = {
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 20,
  radiusRound: 9999,

  paddingSm: 12,
  paddingMd: 16,
  paddingLg: 24,

  fontXs: 12,
  fontSm: 14,
  fontMd: 16,
  fontLg: 18,
  fontXl: 22,
  font2xl: 28,
  font3xl: 36,
};

export const SHADOWS = {
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
};
