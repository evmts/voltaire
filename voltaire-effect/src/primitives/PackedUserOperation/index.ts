/**
 * PackedUserOperation module for Effect-based ERC-4337 account abstraction.
 *
 * Provides Effect-wrapped operations for packed user operations, which are
 * gas-optimized encodings of ERC-4337 UserOperations.
 *
 * @example
 * ```typescript
 * import * as PackedUserOperation from 'voltaire-effect/primitives/PackedUserOperation'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create packed user operation
 *   const packed = yield* PackedUserOperation.from({
 *     sender: '0x1234...',
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
 *   const userOpHash = yield* PackedUserOperation.hash(packed, entryPoint, chainId)
 *
 *   // Unpack to full UserOperation
 *   const userOp = yield* PackedUserOperation.unpack(packed)
 * })
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { type PackedUserOperationType, PackedUserOperationSchema, type PackedUserOperationInput } from './PackedUserOperationSchema.js'
export { from, type PackedUserOperationFromParams } from './from.js'
export { hash } from './hash.js'
export { unpack } from './unpack.js'
