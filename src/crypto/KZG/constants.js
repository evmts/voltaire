/**
 * EIP-4844 Blob Constants
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */

/**
 * Total bytes per blob (128 KB)
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_BLOB = 131072;

/**
 * Bytes per KZG commitment (BLS12-381 G1 point)
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_COMMITMENT = 48;

/**
 * Bytes per KZG proof (BLS12-381 G1 point)
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_PROOF = 48;

/**
 * Bytes per field element
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_FIELD_ELEMENT = 32;

/**
 * Number of field elements per blob
 * @type {number}
 * @since 0.0.0
 */
export const FIELD_ELEMENTS_PER_BLOB = 4096;
