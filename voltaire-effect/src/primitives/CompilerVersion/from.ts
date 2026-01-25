import { CompilerVersion } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { CompilerVersionType } from './CompilerVersionSchema.js'

/**
 * Error thrown when compiler version operations fail.
 * @since 0.0.1
 */
export class CompilerVersionError extends Error {
  readonly _tag = 'CompilerVersionError'
  constructor(message: string) {
    super(message)
    this.name = 'CompilerVersionError'
  }
}

/**
 * Creates a CompilerVersion from a version string.
 *
 * @param value - Version string (e.g., "0.8.20")
 * @returns Effect yielding CompilerVersionType or failing with CompilerVersionError
 * @example
 * ```typescript
 * import * as CompilerVersion from 'voltaire-effect/CompilerVersion'
 * import { Effect } from 'effect'
 *
 * const program = CompilerVersion.from('0.8.20')
 * const version = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<CompilerVersionType, CompilerVersionError> =>
  Effect.try({
    try: () => CompilerVersion.from(value),
    catch: (e) => new CompilerVersionError((e as Error).message)
  })

/**
 * Parses a version string into its components.
 *
 * @param version - Version string to parse
 * @returns Effect yielding parsed version object
 * @example
 * ```typescript
 * import * as CompilerVersion from 'voltaire-effect/CompilerVersion'
 * import { Effect } from 'effect'
 *
 * const parsed = Effect.runSync(CompilerVersion.parse('0.8.20'))
 * // { major: 0, minor: 8, patch: 20 }
 * ```
 * @since 0.0.1
 */
export const parse = (version: string): Effect.Effect<{ major: number; minor: number; patch: number; commit?: string; prerelease?: string }, CompilerVersionError> =>
  Effect.try({
    try: () => CompilerVersion.parse(version),
    catch: (e) => new CompilerVersionError((e as Error).message)
  })

/**
 * Compares two version strings.
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns Effect yielding -1 if a < b, 0 if equal, 1 if a > b
 * @example
 * ```typescript
 * import * as CompilerVersion from 'voltaire-effect/CompilerVersion'
 * import { Effect } from 'effect'
 *
 * const result = Effect.runSync(CompilerVersion.compare('0.8.20', '0.8.19'))
 * // 1 (a is newer)
 * ```
 * @since 0.0.1
 */
export const compare = (a: string, b: string): Effect.Effect<number, never> =>
  Effect.succeed(CompilerVersion.compare(a, b))

/**
 * Gets the major version number.
 *
 * @param version - Version string
 * @returns Effect yielding major version number
 * @since 0.0.1
 */
export const getMajor = (version: string): Effect.Effect<number, CompilerVersionError> =>
  Effect.try({
    try: () => CompilerVersion.getMajor(version),
    catch: (e) => new CompilerVersionError((e as Error).message)
  })

/**
 * Gets the minor version number.
 *
 * @param version - Version string
 * @returns Effect yielding minor version number
 * @since 0.0.1
 */
export const getMinor = (version: string): Effect.Effect<number, CompilerVersionError> =>
  Effect.try({
    try: () => CompilerVersion.getMinor(version),
    catch: (e) => new CompilerVersionError((e as Error).message)
  })

/**
 * Gets the patch version number.
 *
 * @param version - Version string
 * @returns Effect yielding patch version number
 * @since 0.0.1
 */
export const getPatch = (version: string): Effect.Effect<number, CompilerVersionError> =>
  Effect.try({
    try: () => CompilerVersion.getPatch(version),
    catch: (e) => new CompilerVersionError((e as Error).message)
  })

/**
 * Checks if a version is compatible with a semver range.
 *
 * @param version - Version string to check
 * @param range - Semver range (e.g., "^0.8.0")
 * @returns Effect yielding true if compatible
 * @example
 * ```typescript
 * import * as CompilerVersion from 'voltaire-effect/CompilerVersion'
 * import { Effect } from 'effect'
 *
 * const compatible = Effect.runSync(CompilerVersion.isCompatible('0.8.20', '^0.8.0'))
 * // true
 * ```
 * @since 0.0.1
 */
export const isCompatible = (version: string, range: string): Effect.Effect<boolean, CompilerVersionError> =>
  Effect.try({
    try: () => CompilerVersion.isCompatible(version, range),
    catch: (e) => new CompilerVersionError((e as Error).message)
  })
