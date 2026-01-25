/**
 * @fileoverview Paymaster module for ERC-4337 account abstraction.
 * 
 * Paymasters are special contracts in ERC-4337 that can sponsor gas fees for
 * UserOperations. They validate and pay for operations on behalf of users,
 * enabling gasless transactions and alternative payment methods.
 * 
 * This module provides Effect-based schemas and functions for creating,
 * validating, and working with Paymaster configurations.
 * 
 * @example
 * ```typescript
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Effect.gen(function* () {
 *   // Create a Paymaster configuration
 *   const paymaster = yield* Paymaster.from({
 *     address: '0x1234567890123456789012345678901234567890',
 *     data: '0xabcdef',
 *     validUntil: 1700000000n
 *   })
 * 
 *   // Validate time constraints
 *   yield* Paymaster.validate(paymaster)
 * 
 *   // Check if currently valid
 *   const currentTime = BigInt(Math.floor(Date.now() / 1000))
 *   const valid = yield* Paymaster.isValid(paymaster, currentTime)
 * 
 *   // Get paymasterAndData for UserOperation
 *   const paymasterAndData = yield* Paymaster.toPaymasterAndData(paymaster)
 * 
 *   return { paymaster, valid, paymasterAndData }
 * })
 * ```
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#extension-paymasters
 * @module Paymaster
 * @since 0.0.1
 */

/** Schema and types for Paymaster */
export { PaymasterSchema, type PaymasterType, type PaymasterInput } from './PaymasterSchema.js'

/** Functions for working with Paymasters */
export { from, validate, isValid, toHex, toPaymasterAndData, isZeroAddress, PaymasterError, type PaymasterFromParams } from './from.js'
