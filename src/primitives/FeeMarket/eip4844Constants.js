// @ts-nocheck

/**
 * EIP-4844 Constants
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 */

/**
 * Minimum blob base fee (wei)
 * @since 0.0.0
 */
export const MIN_BLOB_BASE_FEE = 1n;

/**
 * Blob base fee exponential update denominator
 * @since 0.0.0
 */
export const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477n;

/**
 * Target blob gas per block (3 blobs worth)
 * @since 0.0.0
 */
export const TARGET_BLOB_GAS_PER_BLOCK = 393216n;

/**
 * Gas per blob (2^17 = 128 KiB)
 * @since 0.0.0
 */
export const BLOB_GAS_PER_BLOB = 131072n;

/**
 * Maximum blobs per block
 * @since 0.0.0
 */
export const MAX_BLOBS_PER_BLOCK = 6n;

/**
 * Maximum blob gas per block
 * @since 0.0.0
 */
export const MAX_BLOB_GAS_PER_BLOCK = MAX_BLOBS_PER_BLOCK * BLOB_GAS_PER_BLOB;
