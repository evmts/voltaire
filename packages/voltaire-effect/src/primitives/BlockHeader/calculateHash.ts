import { type BlockHash, BlockHeader } from "@tevm/voltaire";

type BlockHeaderType = BlockHeader.BlockHeaderType;
type BlockHashType = BlockHash.BlockHashType;

/**
 * Calculates the Keccak-256 hash of a block header.
 * RLP encodes the header and hashes the result.
 * Pure function - never throws.
 *
 * @param header - The block header to hash
 * @returns 32-byte block hash
 *
 * @example
 * ```typescript
 * import * as BlockHeader from 'voltaire-effect/primitives/BlockHeader'
 *
 * const hash = BlockHeader.calculateHash(header)
 * ```
 *
 * @since 0.0.1
 */
export const calculateHash = (header: BlockHeaderType): BlockHashType =>
	BlockHeader.calculateHash(header);
