/**
 * Maximum MultiTokenId value (2^256 - 1)
 */
export const MAX = (1n << 256n) - 1n;

/**
 * Minimum MultiTokenId value (0)
 */
export const MIN = 0n;

/**
 * Fungible token threshold (by convention)
 * Token IDs below this are often fungible (like ERC-20)
 * Token IDs at or above are often non-fungible (like ERC-721)
 */
export const FUNGIBLE_THRESHOLD = 1n << 128n;
