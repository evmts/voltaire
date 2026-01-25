import { StealthAddress } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type SpendingPublicKey = Uint8Array & { readonly __tag: 'SpendingPublicKey' }
type ViewingPublicKey = Uint8Array & { readonly __tag: 'ViewingPublicKey' }
type StealthMetaAddress = Uint8Array & { readonly __tag: 'StealthMetaAddress' }

/**
 * Error thrown when stealth address operations fail.
 *
 * @example
 * ```typescript
 * import { StealthAddress } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(StealthAddress.parseMetaAddress(invalidData)).catch(e => {
 *   if (e._tag === 'StealthAddressError') {
 *     console.error('StealthAddress error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class StealthAddressError extends Error {
  readonly _tag = 'StealthAddressError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'StealthAddressError'
  }
}

/**
 * Generates a stealth meta-address from spending and viewing public keys.
 * Used for EIP-5564 stealth address protocol.
 *
 * @param {SpendingPublicKey} spendingPubKey - The spending public key (33 bytes compressed)
 * @param {ViewingPublicKey} viewingPubKey - The viewing public key (33 bytes compressed)
 * @returns {Effect.Effect<StealthMetaAddress, StealthAddressError>} Effect containing the meta-address or an error
 *
 * @example
 * ```typescript
 * import { StealthAddress } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const metaAddress = yield* StealthAddress.generateMetaAddress(
 *     spendingPubKey,
 *     viewingPubKey
 *   )
 *   return metaAddress
 * })
 * ```
 *
 * @since 0.0.1
 */
export const generateMetaAddress = (
  spendingPubKey: SpendingPublicKey,
  viewingPubKey: ViewingPublicKey
): Effect.Effect<StealthMetaAddress, StealthAddressError> =>
  Effect.try({
    try: () => StealthAddress.generateMetaAddress(spendingPubKey, viewingPubKey) as StealthMetaAddress,
    catch: (e) => new StealthAddressError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })

/**
 * Parses a stealth meta-address to extract spending and viewing public keys.
 *
 * @param {Uint8Array} metaAddress - The 66-byte meta-address to parse
 * @returns {Effect.Effect<{ spendingPubKey: SpendingPublicKey; viewingPubKey: ViewingPublicKey }, StealthAddressError>} Effect containing the parsed keys or an error
 *
 * @example
 * ```typescript
 * import { StealthAddress } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const { spendingPubKey, viewingPubKey } = yield* StealthAddress.parseMetaAddress(metaAddress)
 *   return { spendingPubKey, viewingPubKey }
 * })
 * ```
 *
 * @since 0.0.1
 */
export const parseMetaAddress = (
  metaAddress: Uint8Array
): Effect.Effect<{ spendingPubKey: SpendingPublicKey; viewingPubKey: ViewingPublicKey }, StealthAddressError> =>
  Effect.try({
    try: () => StealthAddress.parseMetaAddress(metaAddress as any) as { spendingPubKey: SpendingPublicKey; viewingPubKey: ViewingPublicKey },
    catch: (e) => new StealthAddressError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
