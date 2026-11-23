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
export const BYTES_PER_BLOB: number;
/**
 * Bytes per KZG commitment (BLS12-381 G1 point)
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_COMMITMENT: number;
/**
 * Bytes per KZG proof (BLS12-381 G1 point)
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_PROOF: number;
/**
 * Bytes per field element
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_FIELD_ELEMENT: number;
/**
 * Number of field elements per blob
 * @type {number}
 * @since 0.0.0
 */
export const FIELD_ELEMENTS_PER_BLOB: number;
/**
 * BLS12-381 scalar field modulus. Every 32-byte field element in a blob or
 * cell must be strictly less than this value (big-endian).
 * @type {bigint}
 * @since 0.0.0
 */
export const BLS_MODULUS: bigint;
/**
 * EIP-7594 PeerDAS Constants
 *
 * @see https://eips.ethereum.org/EIPS/eip-7594
 * @see https://github.com/ethereum/consensus-specs/blob/dev/specs/fulu/polynomial-commitments-sampling.md
 */
/**
 * Number of field elements per cell
 * @type {number}
 * @since 0.0.0
 */
export const FIELD_ELEMENTS_PER_CELL: number;
/**
 * Number of field elements in an extended (Reed-Solomon encoded) blob
 * @type {number}
 * @since 0.0.0
 */
export const FIELD_ELEMENTS_PER_EXT_BLOB: number;
/**
 * Bytes per cell (64 field elements of 32 bytes)
 * @type {number}
 * @since 0.0.0
 */
export const BYTES_PER_CELL: number;
/**
 * Number of cells in a blob before extension. Any 64 distinct cells of the
 * 128 are enough to recover the rest.
 * @type {number}
 * @since 0.0.0
 */
export const CELLS_PER_BLOB: number;
/**
 * Number of cells in an extended blob
 * @type {number}
 * @since 0.0.0
 */
export const CELLS_PER_EXT_BLOB: number;
//# sourceMappingURL=constants.d.ts.map