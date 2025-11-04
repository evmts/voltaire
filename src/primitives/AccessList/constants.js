/**
 * Gas cost constants for EIP-2930 Access Lists
 */

/** Gas cost per address in access list (EIP-2930) */
export const ADDRESS_COST = 2400n;

/** Gas cost per storage key in access list (EIP-2930) */
export const STORAGE_KEY_COST = 1900n;

/** Cold account access cost (pre-EIP-2930) */
export const COLD_ACCOUNT_ACCESS_COST = 2600n;

/** Cold storage access cost (pre-EIP-2930) */
export const COLD_STORAGE_ACCESS_COST = 2100n;

/** Warm storage access cost (post-EIP-2929) */
export const WARM_STORAGE_ACCESS_COST = 100n;
