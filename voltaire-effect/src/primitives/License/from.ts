import { License } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The License type representing a validated SPDX license identifier.
 * @since 0.0.1
 */
type LicenseType = ReturnType<typeof License.from>

/**
 * Error thrown when License parsing fails due to invalid input.
 *
 * @example
 * ```typescript
 * import * as License from 'voltaire-effect/License'
 * import * as Effect from 'effect/Effect'
 *
 * const result = License.from('')
 * Effect.runSync(Effect.either(result))
 * // Left(LicenseError { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class LicenseError extends Error {
  readonly _tag = 'LicenseError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'LicenseError'
  }
}

/**
 * Creates a License from a string, wrapped in an Effect.
 * Validates that the input is a valid SPDX license identifier.
 *
 * @param value - The license identifier string (e.g., "MIT", "Apache-2.0")
 * @returns An Effect that resolves to LicenseType or fails with LicenseError
 *
 * @example
 * ```typescript
 * import * as License from 'voltaire-effect/License'
 * import * as Effect from 'effect/Effect'
 *
 * const license = Effect.runSync(License.from('MIT'))
 * const apache = Effect.runSync(License.from('Apache-2.0'))
 * ```
 *
 * @since 0.0.1
 */
export function from(value: string): Effect.Effect<LicenseType, LicenseError> {
  return Effect.try({
    try: () => License.from(value),
    catch: (e) => new LicenseError((e as Error).message, e)
  })
}
