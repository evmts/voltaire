/**
 * @module BlockHash
 * @description Effect Schemas for 32-byte Ethereum block hashes.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `BlockHash.Hex` | hex string | BlockHashType |
 * | `BlockHash.Bytes` | Uint8Array | BlockHashType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const hash = S.decodeSync(BlockHash.Hex)('0xd4e56740...')
 *
 * // Encode (format output)
 * const hex = S.encodeSync(BlockHash.Hex)(hash)
 * ```
 *
 * ## Pure Functions
 *
 * - `equals(a, b)` - Compare two block hashes
 * - `toHex(hash)` - Convert to hex string
 *
 * @since 0.1.0
 */

// Schemas
export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";

// Re-export pure functions from voltaire
import { BlockHash } from "@tevm/voltaire";

export const equals = BlockHash.equals;
export const toHex = BlockHash.toHex;

// Type export
import { BlockHash as _BlockHash } from "@tevm/voltaire";
export type BlockHashType = _BlockHash.BlockHashType;

// Legacy schema exports for backward compatibility
export {
	BlockHashSchema,
	BlockHashSchema as Schema,
} from "./BlockHashSchema.js";
