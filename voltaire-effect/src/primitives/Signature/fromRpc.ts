/**
 * @fileoverview Creates Signature from RPC format with Effect error handling.
 * @module Signature/fromRpc
 * @since 0.0.1
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates a Signature from RPC format.
 *
 * @param rpc - RPC format signature with r, s, and optional yParity/v
 * @returns Effect containing the SignatureType
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = await Effect.runPromise(
 *   Signature.fromRpc({ r: '0x...', s: '0x...', yParity: '0x0' })
 * )
 * ```
 *
 * @since 0.0.1
 */
export const fromRpc = (
  rpc: { r: string; s: string; yParity?: string | number; v?: string | number }
): Effect.Effect<SignatureType> =>
  Effect.sync(() => Signature.fromRpc(rpc))
