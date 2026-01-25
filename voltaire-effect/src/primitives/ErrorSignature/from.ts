/**
 * @fileoverview Effect-based functions for creating and manipulating error signatures.
 * @module ErrorSignature/from
 * @since 0.0.1
 *
 * @description
 * Provides Effect-wrapped operations for creating and comparing error signatures.
 * Error signatures are 4-byte selectors that identify Solidity custom errors.
 */

import { ErrorSignature } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { ErrorSignatureType, ErrorSignatureLike } from './ErrorSignatureSchema.js'

/**
 * Error thrown when error signature operations fail.
 *
 * @description
 * This error occurs when attempting to create an error signature from invalid input,
 * such as a malformed error definition or invalid hex string.
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const result = ErrorSignature.from('invalid error')
 * Effect.runSync(Effect.either(result))
 * // Left(ErrorSignatureError { message: 'Invalid error signature' })
 * ```
 *
 * @see {@link from} for the function that throws this error
 * @since 0.0.1
 */
export class ErrorSignatureError extends Error {
  /** Discriminant tag for Effect error handling */
  readonly _tag = 'ErrorSignatureError'

  /**
   * Creates a new ErrorSignatureError.
   * @param message - Description of what went wrong
   */
  constructor(message: string) {
    super(message)
    this.name = 'ErrorSignatureError'
  }
}

/**
 * Creates an ErrorSignature from various input types.
 *
 * @description
 * Accepts error definition strings, hex-encoded selectors, or raw bytes.
 * For error definition strings, computes keccak256 hash and takes first 4 bytes.
 *
 * @param value - Hex string, bytes, or error signature string
 * @returns Effect yielding ErrorSignatureType or failing with ErrorSignatureError
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import { Effect } from 'effect'
 *
 * // From hex (standard Error(string) selector)
 * const program = ErrorSignature.from('0x08c379a0')
 * const sig = Effect.runSync(program)
 *
 * // From error definition
 * const custom = ErrorSignature.from('InsufficientBalance(uint256,uint256)')
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const sig = yield* ErrorSignature.from('Panic(uint256)')
 *   const hex = yield* ErrorSignature.toHex(sig)
 *   return hex  // '0x4e487b71'
 * })
 * ```
 *
 * @throws {ErrorSignatureError} When input is invalid
 * @see {@link fromSignature} for explicit signature parsing
 * @see {@link fromHex} for hex parsing
 * @since 0.0.1
 */
export const from = (value: ErrorSignatureLike): Effect.Effect<ErrorSignatureType, ErrorSignatureError> =>
  Effect.try({
    try: () => ErrorSignature.from(value),
    catch: (e) => new ErrorSignatureError((e as Error).message)
  })

/**
 * Creates an ErrorSignature from hex string.
 *
 * @description
 * Parses a 4-byte hex string (with 0x prefix) into an error signature.
 *
 * @param hex - 4-byte hex string with 0x prefix
 * @returns Effect yielding ErrorSignatureType or failing with ErrorSignatureError
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as Effect from 'effect/Effect'
 *
 * // Standard Error(string) selector
 * const sig = Effect.runSync(ErrorSignature.fromHex('0x08c379a0'))
 *
 * // Panic(uint256) selector
 * const panic = Effect.runSync(ErrorSignature.fromHex('0x4e487b71'))
 * ```
 *
 * @throws {ErrorSignatureError} When hex is invalid or wrong length
 * @see {@link from} for general-purpose creation
 * @see {@link toHex} for reverse operation
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<ErrorSignatureType, ErrorSignatureError> =>
  Effect.try({
    try: () => ErrorSignature.fromHex(hex),
    catch: (e) => new ErrorSignatureError((e as Error).message)
  })

/**
 * Creates an ErrorSignature from error signature string.
 *
 * @description
 * Takes an error signature string and computes its 4-byte selector.
 * The signature should be in canonical form: ErrorName(type1,type2,...)
 *
 * @param signature - Error signature (e.g., "InsufficientBalance(uint256,uint256)")
 * @returns Effect yielding ErrorSignatureType (first 4 bytes of keccak256)
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as Effect from 'effect/Effect'
 *
 * // Standard Solidity errors
 * const error = Effect.runSync(
 *   ErrorSignature.fromSignature('Error(string)')
 * )  // 0x08c379a0
 *
 * const panic = Effect.runSync(
 *   ErrorSignature.fromSignature('Panic(uint256)')
 * )  // 0x4e487b71
 *
 * // Custom errors
 * const custom = Effect.runSync(
 *   ErrorSignature.fromSignature('InsufficientBalance(uint256,uint256)')
 * )
 * ```
 *
 * @throws {ErrorSignatureError} When signature is malformed
 * @see {@link from} for general-purpose creation
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<ErrorSignatureType, ErrorSignatureError> =>
  Effect.try({
    try: () => ErrorSignature.fromSignature(signature),
    catch: (e) => new ErrorSignatureError((e as Error).message)
  })

/**
 * Converts an ErrorSignature to hex string.
 *
 * @description
 * Returns the 4-byte error signature as a hex string with 0x prefix.
 * This is a pure function that never fails.
 *
 * @param sig - The error signature to convert
 * @returns Effect yielding hex string (always succeeds)
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sig = yield* ErrorSignature.from('Error(string)')
 *   const hex = yield* ErrorSignature.toHex(sig)
 *   console.log(hex)  // '0x08c379a0'
 *   return hex
 * })
 * ```
 *
 * @see {@link fromHex} for reverse operation
 * @since 0.0.1
 */
export const toHex = (sig: ErrorSignatureType): Effect.Effect<string, never> =>
  Effect.succeed(ErrorSignature.toHex(sig))

/**
 * Compares two error signatures for equality.
 *
 * @description
 * Performs a byte-by-byte comparison of two error signatures.
 * This is a pure function that never fails.
 *
 * @param a - First error signature
 * @param b - Second error signature
 * @returns Effect yielding true if equal, false otherwise
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const a = yield* ErrorSignature.fromSignature('Error(string)')
 *   const b = yield* ErrorSignature.fromHex('0x08c379a0')
 *   const areEqual = yield* ErrorSignature.equals(a, b)
 *   return areEqual  // true
 * })
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: ErrorSignatureType, b: ErrorSignatureType): Effect.Effect<boolean, never> =>
  Effect.succeed(ErrorSignature.equals(a, b))
