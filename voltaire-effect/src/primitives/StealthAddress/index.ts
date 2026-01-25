/**
 * @module StealthAddress
 *
 * Effect-based module for working with EIP-5564 stealth addresses.
 * Stealth addresses provide privacy by generating one-time addresses.
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
export { StealthMetaAddressSchema } from './StealthAddressSchema.js'
export { generateMetaAddress, parseMetaAddress, StealthAddressError } from './from.js'
