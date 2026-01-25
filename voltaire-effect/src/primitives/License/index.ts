/**
 * License module for working with SPDX license identifiers in Effect.
 * Validates and parses software license identifiers commonly found in smart contracts.
 *
 * @example
 * ```typescript
 * import * as License from 'voltaire-effect/License'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a license
 * const license = Effect.runSync(License.from('MIT'))
 *
 * // Using the Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(License.LicenseSchema)('Apache-2.0')
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { LicenseSchema } from './LicenseSchema.js'
export { from, LicenseError } from './from.js'
