/**
 * Signature size constants
 */

/** Size of ECDSA signature (r + s) in bytes */
export const ECDSA_SIZE = 64;

/** Size of ECDSA signature with recovery ID (r + s + v) in bytes */
export const ECDSA_WITH_V_SIZE = 65;

/** Size of Ed25519 signature in bytes */
export const ED25519_SIZE = 64;

/** Size of r or s component in bytes */
export const COMPONENT_SIZE = 32;

/** Ethereum recovery ID values */
export const RECOVERY_ID_MIN = 27;
export const RECOVERY_ID_MAX = 28;
