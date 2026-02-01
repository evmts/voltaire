/**
 * EIP-7702 Authorization Constants
 */

/**
 * EIP-7702 magic byte for signing hash
 */
export const MAGIC_BYTE = 0x05;

/**
 * Gas cost per empty account authorization
 */
export const PER_EMPTY_ACCOUNT_COST = 25000n;

/**
 * Base gas cost per authorization
 */
export const PER_AUTH_BASE_COST = 12500n;

/**
 * secp256k1 curve order N
 */
export const SECP256K1_N =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/**
 * secp256k1 curve order N / 2 (for malleability check)
 */
export const SECP256K1_HALF_N = SECP256K1_N >> 1n;
