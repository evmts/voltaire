/**
 * Blob constants for EIP-4844
 */

/** Blob size in bytes (128 KB = 4096 field elements * 32 bytes) */
export const SIZE = 131072;

/** Number of field elements per blob */
export const FIELD_ELEMENTS_PER_BLOB = 4096;

/** Bytes per field element */
export const BYTES_PER_FIELD_ELEMENT = 32;

/** Maximum blobs per transaction */
export const MAX_PER_TRANSACTION = 6;

/** Blob commitment version byte for KZG */
export const COMMITMENT_VERSION_KZG = 0x01;

/** Blob gas per blob (2^17) */
export const GAS_PER_BLOB = 131072;

/** Target blob gas per block (3 blobs) */
export const TARGET_GAS_PER_BLOCK = 393216;
