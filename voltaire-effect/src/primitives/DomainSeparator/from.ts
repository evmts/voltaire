import { DomainSeparator } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { DomainSeparatorType } from './DomainSeparatorSchema.js'

/**
 * Error thrown when domain separator operations fail.
 * @since 0.0.1
 */
export class DomainSeparatorError extends Error {
  readonly _tag = 'DomainSeparatorError'
  constructor(message: string) {
    super(message)
    this.name = 'DomainSeparatorError'
  }
}

/**
 * Creates a DomainSeparator from hex string or bytes.
 *
 * @param value - Hex string or 32-byte Uint8Array
 * @returns Effect yielding DomainSeparatorType or failing with DomainSeparatorError
 * @example
 * ```typescript
 * import * as DomainSeparator from 'voltaire-effect/DomainSeparator'
 * import { Effect } from 'effect'
 *
 * const program = DomainSeparator.from('0x...')
 * const separator = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<DomainSeparatorType, DomainSeparatorError> =>
  Effect.try({
    try: () => DomainSeparator.from(value),
    catch: (e) => new DomainSeparatorError((e as Error).message)
  })

/**
 * Creates a DomainSeparator from bytes.
 *
 * @param bytes - 32-byte Uint8Array
 * @returns Effect yielding DomainSeparatorType or failing with DomainSeparatorError
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<DomainSeparatorType, DomainSeparatorError> =>
  Effect.try({
    try: () => DomainSeparator.fromBytes(bytes),
    catch: (e) => new DomainSeparatorError((e as Error).message)
  })

/**
 * Creates a DomainSeparator from hex string.
 *
 * @param hex - Hex string (66 chars including 0x prefix)
 * @returns Effect yielding DomainSeparatorType or failing with DomainSeparatorError
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<DomainSeparatorType, DomainSeparatorError> =>
  Effect.try({
    try: () => DomainSeparator.fromHex(hex),
    catch: (e) => new DomainSeparatorError((e as Error).message)
  })

/**
 * Converts a DomainSeparator to hex string.
 *
 * @param separator - The domain separator
 * @returns Effect yielding hex string
 * @since 0.0.1
 */
export const toHex = (separator: DomainSeparatorType): Effect.Effect<string, never> =>
  Effect.succeed(DomainSeparator.toHex(separator))

/**
 * Compares two domain separators for equality.
 *
 * @param a - First domain separator
 * @param b - Second domain separator
 * @returns Effect yielding true if equal
 * @since 0.0.1
 */
export const equals = (a: DomainSeparatorType, b: DomainSeparatorType): Effect.Effect<boolean, never> =>
  Effect.succeed(DomainSeparator.equals(a, b))
