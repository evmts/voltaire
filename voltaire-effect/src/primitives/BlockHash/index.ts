/**
 * @fileoverview BlockHash module for 32-byte block hashes.
 * Provides Effect-based schemas and functions for block hash handling.
 *
 * A block hash is a 32-byte (256-bit) Keccak-256 hash that uniquely identifies
 * an Ethereum block. Block hashes are computed from the RLP-encoded block header
 * and are used for:
 * - Referencing blocks in RPC calls
 * - Building the blockchain (parent hash)
 * - Verifying block integrity
 *
 * This module provides:
 * - Schema validation for block hashes
 * - Effect-based constructors with error handling
 * - Conversion utilities (to/from hex)
 *
 * @module BlockHash
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse a block hash from hex
 * const hash = await Effect.runPromise(BlockHash.from('0x...'))
 *
 * // Convert back to hex
 * const hex = BlockHash.toHex(hash)
 *
 * // Schema validation
 * import * as Schema from 'effect/Schema'
 * const validated = Schema.decodeSync(BlockHash.Schema)('0x...')
 * ```
 *
 * @see {@link BlockHashSchema} for schema-based validation
 * @see {@link from} for Effect-based construction
 * @see {@link toHex} for hex conversion
 */

export { BlockHashSchema, BlockHashSchema as Schema } from './BlockHashSchema.js'
export { from } from './from.js'
export { toHex } from './toHex.js'
