/**
 * @fileoverview UserOperation module for ERC-4337 account abstraction.
 *
 * ERC-4337 defines a standard for account abstraction on Ethereum without
 * requiring protocol changes. UserOperations are the core primitive - they
 * represent operations that users want to execute through their smart
 * contract accounts.
 *
 * This module provides Effect-based schemas and functions for creating,
 * validating, hashing, and packing UserOperations.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as UserOperation from 'voltaire-effect/primitives/UserOperation'
 *
 * function submitUserOp(userOp: UserOperation.UserOperationType) {
 *   // ...
 * }
 * ```
 *
 * @example
 * ```typescript
 * import * as UserOperation from 'voltaire-effect/primitives/UserOperation'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create a UserOperation
 *   const userOp = yield* UserOperation.from({
 *     sender: '0x1234567890123456789012345678901234567890',
 *     nonce: 0n,
 *     initCode: '0x',
 *     callData: '0xabcdef',
 *     callGasLimit: 100000n,
 *     verificationGasLimit: 100000n,
 *     preVerificationGas: 21000n,
 *     maxFeePerGas: 1000000000n,
 *     maxPriorityFeePerGas: 1000000000n,
 *     paymasterAndData: '0x',
 *     signature: '0x'
 *   })
 *
 *   // Compute hash for signing
 *   const hash = yield* UserOperation.hash(
 *     userOp,
 *     '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
 *     1n
 *   )
 *
 *   // Pack for v0.7 EntryPoint
 *   const packed = yield* UserOperation.pack(userOp)
 *
 *   return { userOp, hash, packed }
 * })
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module UserOperation
 * @since 0.0.1
 */

/**
 * Create a UserOperation from flexible input types.
 * @see UserOperationFromParams - The input parameter type
 */
/**
 * Compute the ERC-4337 UserOperation hash for signing.
 */
/**
 * Pack a UserOperation into v0.7 packed format.
 * @see PackedUserOperation - For working with packed operations
 */
/**
 * The validated UserOperation type with native field types.
 * @see UserOperationSchema - For parsing from JSON-RPC format
 */
export {
	type UserOperationInput,
	UserOperationSchema,
	type UserOperationType,
} from "./UserOperationSchema.js";
