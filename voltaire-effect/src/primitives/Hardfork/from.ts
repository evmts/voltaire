import { Hardfork } from '@tevm/voltaire'
import type { HardforkType } from './HardforkSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when hardfork operations fail.
 * @since 0.0.1
 */
export class HardforkError {
  readonly _tag = 'HardforkError'
  constructor(readonly message: string) {}
}

/**
 * Creates a Hardfork from a string name.
 * @param name - Hardfork name (e.g., 'london', 'cancun')
 * @returns Effect containing HardforkType or HardforkError
 * @example
 * ```ts
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * const fork = Hardfork.fromString('london')
 * ```
 * @since 0.0.1
 */
export const fromString = (name: string): Effect.Effect<HardforkType, HardforkError> =>
  Effect.try({
    try: () => {
      const result = Hardfork.fromString(name)
      if (result === undefined) {
        throw new Error(`Invalid hardfork name: ${name}`)
      }
      return result
    },
    catch: (e) => new HardforkError((e as Error).message)
  })

/**
 * Checks if a hardfork is at least the specified minimum.
 * @param fork - Hardfork to check
 * @param minFork - Minimum required hardfork
 * @returns true if fork >= minFork
 * @example
 * ```ts
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * Hardfork.isAtLeast(LONDON, BERLIN) // true
 * ```
 * @since 0.0.1
 */
export const isAtLeast = (fork: HardforkType, minFork: HardforkType): boolean =>
  Hardfork.isAtLeast(fork, minFork)

/**
 * Checks if a hardfork is before the specified hardfork.
 * @param fork - Hardfork to check
 * @param maxFork - Maximum hardfork (exclusive)
 * @returns true if fork < maxFork
 * @example
 * ```ts
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * Hardfork.isBefore(BERLIN, LONDON) // true
 * ```
 * @since 0.0.1
 */
export const isBefore = (fork: HardforkType, maxFork: HardforkType): boolean =>
  Hardfork.isBefore(fork, maxFork)

/**
 * Checks if a hardfork is after the specified hardfork.
 * @param fork - Hardfork to check
 * @param minFork - Minimum hardfork (exclusive)
 * @returns true if fork > minFork
 * @example
 * ```ts
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * Hardfork.isAfter(LONDON, BERLIN) // true
 * ```
 * @since 0.0.1
 */
export const isAfter = (fork: HardforkType, minFork: HardforkType): boolean =>
  Hardfork.isAfter(fork, minFork)

/**
 * Checks if a hardfork supports EIP-1559 (dynamic fee market).
 * @param fork - Hardfork to check
 * @returns true if fork >= London
 * @example
 * ```ts
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * Hardfork.hasEIP1559(LONDON) // true
 * ```
 * @since 0.0.1
 */
export const hasEIP1559 = (fork: HardforkType): boolean =>
  Hardfork.hasEIP1559(fork)

/**
 * Checks if a hardfork supports EIP-4844 (blob transactions).
 * @param fork - Hardfork to check
 * @returns true if fork >= Cancun
 * @example
 * ```ts
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * Hardfork.hasEIP4844(CANCUN) // true
 * ```
 * @since 0.0.1
 */
export const hasEIP4844 = (fork: HardforkType): boolean =>
  Hardfork.hasEIP4844(fork)

/**
 * Checks if a hardfork is post-merge (proof-of-stake).
 * @param fork - Hardfork to check
 * @returns true if fork >= Paris (The Merge)
 * @example
 * ```ts
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * Hardfork.isPostMerge(SHANGHAI) // true
 * ```
 * @since 0.0.1
 */
export const isPostMerge = (fork: HardforkType): boolean =>
  Hardfork.isPostMerge(fork)
