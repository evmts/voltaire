import { BlockHash } from '@tevm/voltaire'

type BlockHashType = BlockHash.BlockHashType

/**
 * Converts a BlockHash to hex string.
 * Pure function - never throws.
 * 
 * @param hash - The block hash to convert
 * @returns 66-character hex string (0x + 64 hex chars)
 * 
 * @example
 * ```typescript
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * 
 * const hex = BlockHash.toHex(hash)
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (hash: BlockHashType): string => BlockHash.toHex(hash)
