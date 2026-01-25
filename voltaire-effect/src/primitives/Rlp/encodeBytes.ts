import { Rlp as VoltaireRlp } from '@tevm/voltaire/Rlp'
import * as Effect from 'effect/Effect'

/**
 * RLP-encodes a byte array according to RLP string rules.
 *
 * @param bytes - Byte array to encode
 * @returns Effect that succeeds with RLP-encoded bytes (infallible)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeBytes } from 'voltaire-effect/primitives/Rlp'
 *
 * // Single byte < 0x80
 * const encoded1 = encodeBytes(new Uint8Array([0x7f]))
 * Effect.runSync(encoded1) // Uint8Array([0x7f])
 *
 * // Short string
 * const encoded2 = encodeBytes(new Uint8Array([1, 2, 3]))
 * Effect.runSync(encoded2) // Uint8Array([0x83, 1, 2, 3])
 * ```
 *
 * @since 0.0.1
 */
export const encodeBytes = (bytes: Uint8Array): Effect.Effect<Uint8Array> =>
  Effect.sync(() => VoltaireRlp.encodeBytes(bytes))
