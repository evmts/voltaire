/**
 * @fileoverview Converts Signature to RPC format with Effect error handling.
 * @module Signature/toRpc
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidAlgorithmError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Converts a secp256k1 Signature to RPC format.
 *
 * @param signature - The SignatureType to convert
 * @returns Effect containing RPC format signature
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const rpc = await Effect.runPromise(Signature.toRpc(sig))
 * // { r: '0x...', s: '0x...', yParity: '0x0', v: '0x1b' }
 * ```
 *
 * @since 0.0.1
 */
export const toRpc = (
  signature: SignatureType
): Effect.Effect<{ r: string; s: string; yParity: string; v?: string }, InvalidAlgorithmError> =>
  Effect.try({
    try: () => Signature.toRpc(signature),
    catch: (e) => e as InvalidAlgorithmError
  })
