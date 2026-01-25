/**
 * @fileoverview Effect-based functions for creating and manipulating EVM function selectors.
 * Provides type-safe operations for working with 4-byte function identifiers.
 * @module Selector/from
 * @since 0.0.1
 */

import { Selector } from '@tevm/voltaire'
import type { SelectorType } from './SelectorSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when selector parsing or validation fails.
 *
 * @description
 * This error is thrown when attempting to create a selector from invalid input,
 * such as a hex string with incorrect length or invalid characters.
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(Selector.from('invalid')).catch(e => {
 *   if (e instanceof Selector.SelectorError) {
 *     console.error('Selector error:', e.message)
 *   }
 * })
 * ```
 *
 * @throws Never - this is the error type, not a throwing function
 * @see {@link from} for the function that throws this error
 * @since 0.0.1
 */
export class SelectorError extends Error {
  /** Discriminant tag for Effect error handling */
  readonly _tag = 'SelectorError'

  /**
   * Creates a new SelectorError.
   * @param message - Description of what went wrong
   */
  constructor(message: string) {
    super(message)
    this.name = 'SelectorError'
  }
}

/**
 * Union type representing valid inputs for creating a Selector.
 *
 * @description
 * Accepts:
 * - SelectorType: An already-validated selector (passthrough)
 * - string: Hex string with or without 0x prefix
 * - Uint8Array: Raw 4-byte array
 *
 * @see {@link from} for usage
 * @since 0.0.1
 */
export type SelectorLike = SelectorType | string | Uint8Array

/**
 * Creates a Selector from a hex string, Uint8Array, or existing SelectorType.
 *
 * @description
 * This is the primary way to create a Selector in Effect-based code.
 * It automatically detects the input type and converts it to a branded SelectorType.
 *
 * @param value - The value to convert to a Selector
 * @returns Effect containing the Selector or a SelectorError
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * // From hex string
 * const selector = Selector.from('0xa9059cbb')
 * Effect.runPromise(selector).then(console.log)
 *
 * // From Uint8Array
 * const fromBytes = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]))
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const sel = yield* Selector.from('0xa9059cbb')
 *   return sel
 * })
 * ```
 *
 * @throws {SelectorError} When the input cannot be parsed as a valid 4-byte selector
 * @see {@link fromHex} for hex-specific parsing
 * @see {@link fromSignature} for creating from function signature
 * @since 0.0.1
 */
export const from = (value: SelectorLike): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.from(value) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })

/**
 * Creates a Selector from a hex string.
 *
 * @description
 * Parses a hex string (with or without 0x prefix) into a 4-byte selector.
 * The string must represent exactly 4 bytes (8 hex characters).
 *
 * @param hex - The hex string (with or without 0x prefix)
 * @returns Effect containing the Selector or a SelectorError
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * // With 0x prefix
 * const selector = Selector.fromHex('0xa9059cbb')
 * Effect.runPromise(selector).then(console.log)
 *
 * // Without prefix
 * const selector2 = Selector.fromHex('a9059cbb')
 * ```
 *
 * @throws {SelectorError} When hex string is invalid or wrong length
 * @see {@link from} for general-purpose creation
 * @see {@link toHex} for reverse operation
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.fromHex(hex) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })

/**
 * Creates a Selector from a function signature by hashing it with keccak256.
 *
 * @description
 * Takes a Solidity function signature string and computes its 4-byte selector
 * by taking the first 4 bytes of keccak256(signature).
 *
 * @param signature - The function signature (e.g., "transfer(address,uint256)")
 * @returns Effect containing the Selector or a SelectorError
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * // ERC20 transfer
 * const selector = Selector.fromSignature('transfer(address,uint256)')
 * Effect.runPromise(selector).then(s => {
 *   console.log(Selector.toHex(s)) // '0xa9059cbb'
 * })
 *
 * // ERC20 balanceOf
 * const balanceOf = Selector.fromSignature('balanceOf(address)')
 * // Result: 0x70a08231
 * ```
 *
 * @throws {SelectorError} When signature is malformed
 * @see {@link from} for general-purpose creation
 * @see {@link fromHex} for known selectors
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.fromSignature(signature) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })

/**
 * Converts a Selector to its hex string representation.
 *
 * @description
 * Returns the 4-byte selector as a hex string with 0x prefix.
 * This is a pure function that never fails.
 *
 * @param selector - The selector to convert
 * @returns Effect containing the hex string (always succeeds)
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const selector = yield* Selector.from('0xa9059cbb')
 *   const hex = yield* Selector.toHex(selector)
 *   return hex // '0xa9059cbb'
 * })
 * ```
 *
 * @see {@link fromHex} for reverse operation
 * @since 0.0.1
 */
export const toHex = (selector: SelectorType): Effect.Effect<string, never> =>
  Effect.succeed(Selector.toHex(selector as unknown as Parameters<typeof Selector.toHex>[0]))

/**
 * Compares two Selectors for equality.
 *
 * @description
 * Performs a byte-by-byte comparison of two selectors.
 * This is a pure function that never fails.
 *
 * @param a - First selector
 * @param b - Second selector
 * @returns Effect containing true if selectors are equal, false otherwise
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const a = yield* Selector.from('0xa9059cbb')
 *   const b = yield* Selector.fromSignature('transfer(address,uint256)')
 *   const areEqual = yield* Selector.equals(a, b)
 *   return areEqual // true
 * })
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: SelectorType, b: SelectorType): Effect.Effect<boolean, never> =>
  Effect.succeed(Selector.equals(
    a as unknown as Parameters<typeof Selector.equals>[0],
    b as unknown as Parameters<typeof Selector.equals>[0]
  ))
