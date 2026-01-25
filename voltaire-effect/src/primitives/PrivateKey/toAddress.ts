/**
 * @fileoverview Effect-based private key to address derivation.
 * @module toAddress
 * @since 0.0.1
 */

import { _toAddress, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Derives the Ethereum address from a private key.
 * 
 * @param privateKey - The private key to derive from
 * @returns Effect yielding the 20-byte Ethereum address
 * 
 * @example
 * ```typescript
 * const address = Effect.runSync(PrivateKey.toAddress(pk))
 * ```
 * 
 * @since 0.0.1
 */
export const toAddress = (privateKey: PrivateKeyType): Effect.Effect<AddressType, Error> =>
  Effect.try({
    try: () => _toAddress.call(privateKey),
    catch: (e) => e as Error
  })
