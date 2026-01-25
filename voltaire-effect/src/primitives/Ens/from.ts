import { Ens } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { EnsType } from './EnsSchema.js'

/**
 * Error thrown when ENS operations fail.
 * @since 0.0.1
 */
export class EnsError extends Error {
  readonly _tag = 'EnsError'
  constructor(message: string) {
    super(message)
    this.name = 'EnsError'
  }
}

/**
 * Creates an ENS name from a string.
 *
 * @param name - ENS name string (e.g., "vitalik.eth")
 * @returns Effect yielding EnsType or failing with EnsError
 * @example
 * ```typescript
 * import * as Ens from 'voltaire-effect/Ens'
 * import { Effect } from 'effect'
 *
 * const program = Ens.from('vitalik.eth')
 * const ensName = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (name: string): Effect.Effect<EnsType, EnsError> =>
  Effect.try({
    try: () => Ens.from(name),
    catch: (e) => new EnsError((e as Error).message)
  })

/**
 * Normalizes an ENS name according to ENSIP-15.
 *
 * @param name - ENS name to normalize
 * @returns Effect yielding normalized EnsType
 * @since 0.0.1
 */
export const normalize = (name: string): Effect.Effect<EnsType, EnsError> =>
  Effect.try({
    try: () => Ens.normalize(name),
    catch: (e) => new EnsError((e as Error).message)
  })

/**
 * Beautifies an ENS name for display.
 *
 * @param name - ENS name to beautify
 * @returns Effect yielding beautified EnsType
 * @since 0.0.1
 */
export const beautify = (name: string): Effect.Effect<EnsType, EnsError> =>
  Effect.try({
    try: () => Ens.beautify(name),
    catch: (e) => new EnsError((e as Error).message)
  })

/**
 * Computes the namehash of an ENS name.
 *
 * @param name - ENS name
 * @returns Effect yielding 32-byte namehash
 * @example
 * ```typescript
 * import * as Ens from 'voltaire-effect/Ens'
 * import { Effect } from 'effect'
 *
 * const hash = Effect.runSync(Ens.namehash('vitalik.eth'))
 * ```
 * @since 0.0.1
 */
export const namehash = (name: string): Effect.Effect<Uint8Array, EnsError> =>
  Effect.try({
    try: () => Ens.namehash(name),
    catch: (e) => new EnsError((e as Error).message)
  })

/**
 * Computes the labelhash of a single ENS label.
 *
 * @param label - Single label (e.g., "vitalik" not "vitalik.eth")
 * @returns Effect yielding 32-byte labelhash
 * @since 0.0.1
 */
export const labelhash = (label: string): Effect.Effect<Uint8Array, EnsError> =>
  Effect.try({
    try: () => Ens.labelhash(label),
    catch: (e) => new EnsError((e as Error).message)
  })

/**
 * Checks if an ENS name is valid.
 *
 * @param name - Name to check
 * @returns Effect yielding true if valid
 * @since 0.0.1
 */
export const isValid = (name: string): Effect.Effect<boolean, never> =>
  Effect.succeed(Ens.isValid(name))

/**
 * Type guard for ENS names.
 *
 * @param value - Value to check
 * @returns Effect yielding true if value is an ENS name
 * @since 0.0.1
 */
export const is = (value: unknown): Effect.Effect<boolean, never> =>
  Effect.succeed(Ens.is(value))

/**
 * Converts an ENS name to string.
 *
 * @param ens - The ENS name
 * @returns Effect yielding string representation
 * @since 0.0.1
 */
export const toString = (ens: EnsType): Effect.Effect<string, never> =>
  Effect.succeed(Ens.toString(ens))

/**
 * Validates an ENS name, throwing if invalid.
 *
 * @param name - Name to validate
 * @returns Effect succeeding if valid, failing with EnsError if invalid
 * @since 0.0.1
 */
export const validate = (name: string): Effect.Effect<void, EnsError> =>
  Effect.try({
    try: () => Ens.validate(name),
    catch: (e) => new EnsError((e as Error).message)
  })
