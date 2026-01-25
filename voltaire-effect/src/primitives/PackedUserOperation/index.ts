/**
 * @fileoverview PackedUserOperation module for ERC-4337 v0.7 account abstraction.
 *
 * ERC-4337 v0.7 introduced a packed format for UserOperations that reduces
 * calldata size by combining multiple gas fields into fixed-size byte arrays.
 * This format is more gas-efficient for on-chain processing.
 *
 * This module provides Effect-based schemas and functions for creating,
 * validating, hashing, and unpacking PackedUserOperations.
 *
 * @example
 * ```typescript
 * import * as PackedUserOperation from 'voltaire-effect/primitives/PackedUserOperation'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create packed user operation
 *   const packed = yield* PackedUserOperation.from({
 *     sender: '0x1234567890123456789012345678901234567890',
 *     nonce: 0n,
 *     initCode: '0x',
 *     callData: '0xabcd',
 *     accountGasLimits: new Uint8Array(32),
 *     preVerificationGas: 21000n,
 *     gasFees: new Uint8Array(32),
 *     paymasterAndData: '0x',
 *     signature: '0x'
 *   })
 *
 *   // Compute hash for signing
 *   const userOpHash = yield* PackedUserOperation.hash(
 *     packed,
 *     '0x0000000071727De22E5E9d8BAf0edAc6f37da032', // v0.7 EntryPoint
 *     1n
 *   )
 *
 *   // Unpack to full UserOperation
 *   const userOp = yield* PackedUserOperation.unpack(packed)
 *
 *   return { packed, userOpHash, userOp }
 * })
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @see UserOperation - For the standard unpacked format
 * @module PackedUserOperation
 * @since 0.0.1
 */

/**
 * Create a PackedUserOperation from flexible input types.
 * @see PackedUserOperationFromParams - The input parameter type
 */
/**
 * Compute the ERC-4337 PackedUserOperation hash for signing.
 */
/**
 * The validated PackedUserOperation type with native field types.
 * @see PackedUserOperationSchema - For parsing from JSON-RPC format
 */
export {
	type PackedUserOperationInput,
	PackedUserOperationSchema,
	type PackedUserOperationType,
} from "./PackedUserOperationSchema.js";

/**
 * Unpack a PackedUserOperation to standard UserOperation format.
 * @see UserOperation - For the unpacked format
 */
