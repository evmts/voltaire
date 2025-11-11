/**
 * Blob constants for EIP-4844
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 */

/**
 * Blob size in bytes (128 KB = 4096 field elements * 32 bytes)
 * @since 0.0.0
 */
export const SIZE = 131072;

/**
 * Number of field elements per blob
 * @since 0.0.0
 */
export const FIELD_ELEMENTS_PER_BLOB = 4096;

/**
 * Bytes per field element
 * @since 0.0.0
 */
export const BYTES_PER_FIELD_ELEMENT = 32;

/**
 * Maximum blobs per transaction
 * @since 0.0.0
 */
export const MAX_PER_TRANSACTION = 6;

/**
 * Blob commitment version byte for KZG
 * @since 0.0.0
 */
export const COMMITMENT_VERSION_KZG = 0x01;

/**
 * Blob gas per blob (2^17)
 * @since 0.0.0
 */
export const GAS_PER_BLOB = 131072;

/**
 * Target blob gas per block (3 blobs)
 * @since 0.0.0
 */
export const TARGET_GAS_PER_BLOCK = 393216;
