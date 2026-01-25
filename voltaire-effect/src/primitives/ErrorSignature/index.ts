/**
 * @fileoverview ErrorSignature module for working with Solidity error selectors.
 * @module ErrorSignature
 * @since 0.0.1
 *
 * @description
 * Error signatures are 4-byte selectors that identify Solidity custom errors.
 * They are computed like function selectors: first 4 bytes of keccak256(signature).
 * When a transaction reverts with a custom error, the selector appears at the start
 * of the revert data.
 *
 * Standard Solidity error selectors:
 * - Error(string): 0x08c379a0 (require with message)
 * - Panic(uint256): 0x4e487b71 (assert failures, overflow, etc.)
 *
 * This module provides:
 * - Type-safe branded ErrorSignatureType
 * - Effect Schema for validation
 * - Functions for creating, converting, and comparing error signatures
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create from error definition
 *   const sig = yield* ErrorSignature.fromSignature('InsufficientBalance(uint256,uint256)')
 *
 *   // Convert to hex for matching revert data
 *   const hex = yield* ErrorSignature.toHex(sig)
 *
 *   // Compare with known errors
 *   const standardError = yield* ErrorSignature.fromHex('0x08c379a0')
 *   const isStandardError = yield* ErrorSignature.equals(sig, standardError)
 * })
 *
 * // Match error in revert data
 * const revertData = '0x08c379a0...'
 * const errorSelector = revertData.slice(0, 10)
 * const isError = await Effect.runPromise(
 *   Effect.gen(function* () {
 *     const sig = yield* ErrorSignature.fromHex(errorSelector)
 *     const standard = yield* ErrorSignature.fromSignature('Error(string)')
 *     return yield* ErrorSignature.equals(sig, standard)
 *   })
 * )
 * ```
 *
 * @see {@link ErrorSignatureSchema} for Effect Schema integration
 * @see {@link from} for Effect-based creation
 * @see {@link ErrorSignatureError} for error handling
 */
export { ErrorSignatureSchema, type ErrorSignatureType, type ErrorSignatureLike } from './ErrorSignatureSchema.js'
export {
  from,
  fromHex,
  fromSignature,
  toHex,
  equals,
  ErrorSignatureError
} from './from.js'
