/**
 * EIP-4844 Blob Constants
 *
 * @constant {number} BYTES_PER_BLOB - Total bytes per blob (128 KB)
 * @constant {number} BYTES_PER_COMMITMENT - Bytes per KZG commitment (BLS12-381 G1 point)
 * @constant {number} BYTES_PER_PROOF - Bytes per KZG proof (BLS12-381 G1 point)
 * @constant {number} BYTES_PER_FIELD_ELEMENT - Bytes per field element
 * @constant {number} FIELD_ELEMENTS_PER_BLOB - Number of field elements per blob
 */
export const BYTES_PER_BLOB = 131072;
export const BYTES_PER_COMMITMENT = 48;
export const BYTES_PER_PROOF = 48;
export const BYTES_PER_FIELD_ELEMENT = 32;
export const FIELD_ELEMENTS_PER_BLOB = 4096;
