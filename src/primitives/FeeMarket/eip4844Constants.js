// @ts-nocheck

/**
 * EIP-4844 Constants
 */

/** Minimum blob base fee (wei) */
export const MIN_BLOB_BASE_FEE = 1n;

/** Blob base fee exponential update denominator */
export const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477n;

/** Target blob gas per block (3 blobs worth) */
export const TARGET_BLOB_GAS_PER_BLOCK = 393216n;

/** Gas per blob (2^17 = 128 KiB) */
export const BLOB_GAS_PER_BLOB = 131072n;

/** Maximum blobs per block */
export const MAX_BLOBS_PER_BLOCK = 6n;

/** Maximum blob gas per block */
export const MAX_BLOB_GAS_PER_BLOCK = MAX_BLOBS_PER_BLOCK * BLOB_GAS_PER_BLOB;
