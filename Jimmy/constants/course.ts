export const WORKER_URL = 'https://yass-webhook.israelntalu328.workers.dev';

export const CATEGORIES = [
  { value: 'technology', label: 'Technologie' },
  { value: 'business', label: 'Business' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'health', label: 'Santé' },
  { value: 'language', label: 'Langues' },
  { value: 'music', label: 'Musique' },
  { value: 'photography', label: 'Photographie' },
  { value: 'cooking', label: 'Cuisine' },
  { value: 'other', label: 'Autre' },
] as const;

export const PRICE_PER_MINUTE = 150;

export const PLATFORM_FEE_PERCENT = 20;

export const calculateCoursePrice = (durationMinutes: number): number => {
  return durationMinutes * PRICE_PER_MINUTE;
};

export const calculateCreatorEarnings = (price: number): number => {
  return price * (1 - PLATFORM_FEE_PERCENT / 100);
};

export const calculatePlatformFee = (price: number): number => {
  return price * (PLATFORM_FEE_PERCENT / 100);
};
