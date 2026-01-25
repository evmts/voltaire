/**
 * Rlp module for Effect-based RLP encoding and decoding.
 *
 * Provides Effect-wrapped operations for Recursive Length Prefix (RLP)
 * encoding used throughout Ethereum for transaction and state serialization.
 *
 * @example
 * ```typescript
 * import * as Rlp from 'voltaire-effect/primitives/Rlp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Encode data
 *   const encoded = yield* Rlp.encode([
 *     new Uint8Array([1, 2, 3]),
 *     new Uint8Array([4, 5, 6])
 *   ])
 *
 *   // Decode data
 *   const { data, remainder } = yield* Rlp.decode(encoded)
 * })
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { Schema, RlpDecodingError, RlpEncodingError } from './RlpSchema.js'
export { encode } from './encode.js'
export { decode, type Decoded } from './decode.js'

/**
 * Re-export of BrandedRlp type from voltaire.
 * @since 0.0.1
 */
export type { BrandedRlp } from '@tevm/voltaire/Rlp'
