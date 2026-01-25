/**
 * @fileoverview Creates Signature from tuple format with Effect error handling.
 * @module Signature/fromTuple
 * @since 0.0.1
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates a Signature from tuple format [yParity, r, s].
 *
 * @param tuple - Tuple [yParity, r, s]
 * @param chainId - Optional chain ID for EIP-155 v encoding
 * @returns Effect containing the SignatureType
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = await Effect.runPromise(
 *   Signature.fromTuple([0, r, s])
 * )
 *
 * // With chain ID for EIP-155
 * const sig155 = await Effect.runPromise(
 *   Signature.fromTuple([0, r, s], 1)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const fromTuple = (
  tuple: [number, Uint8Array, Uint8Array],
  chainId?: number
): Effect.Effect<SignatureType> =>
  Effect.sync(() => Signature.fromTuple(tuple, chainId))
