/**
 * @fileoverview Effect-based functions for parsing Solidity function signatures.
 * @module FunctionSignature/from
 * @since 0.0.1
 *
 * @description
 * Provides Effect-wrapped operations for parsing and validating Solidity
 * function signatures like "transfer(address,uint256)".
 */

import { FunctionSignature } from '@tevm/voltaire'
import type { FunctionSignatureType } from './FunctionSignatureSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when function signature parsing fails.
 *
 * @description
 * This error occurs when attempting to parse a malformed function signature,
 * such as missing parentheses or invalid parameter types.
 *
 * @example
 * ```typescript
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const result = FunctionSignature.from('invalid')
 * Effect.runSync(Effect.either(result))
 * // Left(FunctionSignatureError { message: 'Invalid function signature' })
 * ```
 *
 * @see {@link from} for the function that throws this error
 * @since 0.0.1
 */
export class FunctionSignatureError {
  /** Discriminant tag for Effect error handling */
  readonly _tag = 'FunctionSignatureError'

  /**
   * Creates a new FunctionSignatureError.
   * @param message - Description of the parsing failure
   */
  constructor(readonly message: string) {}
}

/**
 * Parses a function signature string into its components.
 *
 * @description
 * Takes a Solidity function signature and extracts:
 * - name: The function name
 * - selector: The 4-byte function selector
 * - signature: The canonical signature string
 *
 * @param value - Function signature like "transfer(address,uint256)"
 * @returns Effect containing FunctionSignatureType or FunctionSignatureError
 *
 * @example
 * ```typescript
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse ERC20 transfer
 * const sig = Effect.runSync(FunctionSignature.from('transfer(address,uint256)'))
 * console.log(sig.name)     // 'transfer'
 * console.log(sig.selector) // Uint8Array [0xa9, 0x05, 0x9c, 0xbb]
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const sig = yield* FunctionSignature.from('balanceOf(address)')
 *   console.log(`Function: ${sig.name}`)
 *   return sig
 * })
 *
 * // Handle errors
 * const result = Effect.runSync(
 *   Effect.catchAll(FunctionSignature.from('invalid'), (e) =>
 *     Effect.succeed(`Error: ${e.message}`)
 *   )
 * )
 * ```
 *
 * @throws {FunctionSignatureError} When signature is malformed
 * @see {@link Schema} for Schema-based validation
 * @see {@link fromSignature} for alternative API
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<FunctionSignatureType, FunctionSignatureError> =>
  Effect.try({
    try: () => FunctionSignature.from(value),
    catch: (e) => new FunctionSignatureError((e as Error).message)
  })

/**
 * Creates a FunctionSignature from a signature string (alias for from).
 *
 * @description
 * Alternative API that is semantically clearer when working with signature strings.
 * Functionally identical to {@link from}.
 *
 * @param signature - Function signature string
 * @returns Effect containing FunctionSignatureType or FunctionSignatureError
 *
 * @example
 * ```typescript
 * import * as FunctionSignature from 'voltaire-effect/primitives/FunctionSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = Effect.runSync(FunctionSignature.fromSignature('balanceOf(address)'))
 * console.log(sig.name)     // 'balanceOf'
 * console.log(sig.selector) // Uint8Array [0x70, 0xa0, 0x82, 0x31]
 * ```
 *
 * @throws {FunctionSignatureError} When signature is malformed
 * @see {@link from} for primary API
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<FunctionSignatureType, FunctionSignatureError> =>
  Effect.try({
    try: () => FunctionSignature.fromSignature(signature),
    catch: (e) => new FunctionSignatureError((e as Error).message)
  })
