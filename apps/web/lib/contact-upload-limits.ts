export const MAX_CONTACT_IMAGES = 2;
export const MAX_CONTACT_IMAGE_BYTES = 1024 * 1024;
export const MAX_CONTACT_TOTAL_BYTES = 2 * 1024 * 1024;
export const MAX_CONTACT_REQUEST_BYTES = MAX_CONTACT_TOTAL_BYTES + 32 * 1024;
export const CONTACT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_CONTACT_DIMENSION = 4096;
export const MAX_CONTACT_PIXELS = 12_000_000;
