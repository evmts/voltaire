import { License } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * The License type representing a validated SPDX license identifier.
 * @since 0.0.1
 */
type LicenseType = ReturnType<typeof License.from>

/**
 * Internal schema declaration for License type validation.
 * @internal
 */
const LicenseTypeSchema = S.declare<LicenseType>(
  (u): u is LicenseType => typeof u === 'string' && u.length > 0,
  { identifier: 'License' }
)

/**
 * Effect Schema for validating and parsing SPDX license identifiers.
 * Common licenses include MIT, Apache-2.0, GPL-3.0, etc.
 *
 * @param input - A string representing the license identifier
 * @returns The validated LicenseType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LicenseSchema } from 'voltaire-effect/License'
 *
 * // Parse a license identifier
 * const license = S.decodeSync(LicenseSchema)('MIT')
 *
 * // Parse Apache license
 * const apache = S.decodeSync(LicenseSchema)('Apache-2.0')
 * ```
 *
 * @since 0.0.1
 */
export const LicenseSchema: S.Schema<LicenseType, string> = S.transformOrFail(
  S.String,
  LicenseTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(License.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (license) => ParseResult.succeed(license as string)
  }
).annotations({ identifier: 'LicenseSchema' })
