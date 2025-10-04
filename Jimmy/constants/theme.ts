export const COLORS = {
  primary: '#007AFF', // Un bleu vibrant pour les actions principales
  background: '#000000', // Fond noir profond pour un look premium
  surface: '#121212', // Une surface légèrement plus claire pour les cartes et les sections
  text: '#FFFFFF',
  textSecondary: '#A9A9A9', // Pour les sous-titres et les informations moins importantes
  accent: '#FFD60A', // Un jaune doré pour les accents et les éléments importants
  error: '#FF453A',
  success: '#30D158',
  border: '#272727',
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Font sizes
  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
};

export const FONTS = {
  h1: { fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontSize: SIZES.h3, lineHeight: 22 },
  h4: { fontSize: SIZES.h4, lineHeight: 22 },
  body1: { fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontSize: SIZES.body4, lineHeight: 22 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;