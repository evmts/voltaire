import { Rlp as VoltaireRlp, type BrandedRlp } from '@tevm/voltaire/Rlp'
import * as Effect from 'effect/Effect'

/**
 * Flattens nested list Data into array of bytes Data (depth-first).
 *
 * @param data - RLP data structure to flatten
 * @returns Effect that succeeds with array of bytes data (infallible)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { flatten } from 'voltaire-effect/primitives/Rlp'
 *
 * const nested = {
 *   type: 'list',
 *   value: [
 *     { type: 'bytes', value: new Uint8Array([1]) },
 *     {
 *       type: 'list',
 *       value: [{ type: 'bytes', value: new Uint8Array([2]) }]
 *     }
 *   ]
 * }
 *
 * const flat = Effect.runSync(flatten(nested))
 * // => [
 * //   { type: 'bytes', value: Uint8Array([1]) },
 * //   { type: 'bytes', value: Uint8Array([2]) }
 * // ]
 * ```
 *
 * @since 0.0.1
 */
export const flatten = (data: BrandedRlp): Effect.Effect<Array<BrandedRlp & { type: 'bytes' }>> =>
  Effect.sync(() => VoltaireRlp.flatten(data))
