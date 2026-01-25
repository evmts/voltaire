import { SignedData } from '@tevm/voltaire'
import type { SignedDataType, SignedDataVersion } from './SignedDataSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when signed data creation or parsing fails.
 *
 * @example
 * ```typescript
 * import { SignedData } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(SignedData.from(0x45, new Uint8Array(), new Uint8Array())).catch(e => {
 *   if (e._tag === 'SignedDataError') {
 *     console.error('SignedData error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class SignedDataError {
  readonly _tag = 'SignedDataError'
  constructor(readonly message: string) {}
}

/**
 * Creates signed data with a specific version prefix.
 * Used for EIP-191 and EIP-712 signed data encoding.
 *
 * @param {SignedDataVersion} version - The version byte (0x00, 0x01, or 0x45)
 * @param {Uint8Array} versionData - Version-specific data (e.g., validator address for 0x00)
 * @param {Uint8Array} data - The actual data to be signed
 * @returns {Effect.Effect<SignedDataType, SignedDataError>} Effect containing the SignedData or an error
 *
 * @example
 * ```typescript
 * import { SignedData } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const signedData = yield* SignedData.from(
 *     0x45,
 *     new Uint8Array([1, 2, 3]),
 *     new Uint8Array([4, 5, 6])
 *   )
 *   return signedData
 * })
 * ```
 *
 * @since 0.0.1
 */
export const from = (
  version: SignedDataVersion,
  versionData: Uint8Array,
  data: Uint8Array
): Effect.Effect<SignedDataType, SignedDataError> =>
  Effect.try({
    try: () => SignedData.from(version, versionData, data),
    catch: (e) => new SignedDataError((e as Error).message)
  })
