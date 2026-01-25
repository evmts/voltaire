import { Rlp as VoltaireRlp, RlpDecodingError } from '@tevm/voltaire/Rlp'
import * as Effect from 'effect/Effect'

/**
 * RLP-decodes bytes to an array.
 *
 * @param data - RLP-encoded data
 * @returns Effect that succeeds with decoded array or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeArray, encodeArray } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = Effect.runSync(encodeArray([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4])
 * ]))
 *
 * const arr = Effect.runSync(decodeArray(encoded))
 * // => [Uint8Array([1, 2]), Uint8Array([3, 4])]
 * ```
 *
 * @since 0.0.1
 */
export const decodeArray = (data: Uint8Array): Effect.Effect<unknown[], RlpDecodingError> =>
  Effect.try({
    try: () => VoltaireRlp.decodeArray(data),
    catch: (e) => e as RlpDecodingError
  })
