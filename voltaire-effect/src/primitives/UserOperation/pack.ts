import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'
import type { UserOperationType } from './UserOperationSchema.js'
import type { PackedUserOperationType } from '../PackedUserOperation/PackedUserOperationSchema.js'

/**
 * Converts a bigint to 16-byte representation.
 * @internal
 */
const uint128ToBytes = (n: bigint): Uint8Array => {
  const hex = (n & ((1n << 128n) - 1n)).toString(16).padStart(32, '0')
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Packs a UserOperation into the ERC-4337 v0.7 packed format.
 * 
 * Combines gas limits and fee fields into packed 32-byte values
 * for more efficient on-chain storage and processing.
 * 
 * @param userOp - UserOperation to pack
 * @returns Effect containing the PackedUserOperation or ValidationError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { pack } from './pack.js'
 * 
 * const packedOp = await Effect.runPromise(pack(userOp))
 * ```
 * 
 * @since 0.0.1
 */
export const pack = (
  userOp: UserOperationType
): Effect.Effect<PackedUserOperationType, ValidationError> =>
  Effect.try({
    try: () => {
      const accountGasLimits = new Uint8Array(32)
      accountGasLimits.set(uint128ToBytes(userOp.verificationGasLimit), 0)
      accountGasLimits.set(uint128ToBytes(userOp.callGasLimit), 16)

      const gasFees = new Uint8Array(32)
      gasFees.set(uint128ToBytes(userOp.maxPriorityFeePerGas), 0)
      gasFees.set(uint128ToBytes(userOp.maxFeePerGas), 16)

      return {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees,
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
      } as PackedUserOperationType
    },
    catch: (e) => {
      if (e instanceof ValidationError) return e
      return new ValidationError(
        e instanceof Error ? e.message : String(e),
        { value: userOp, expected: 'valid UserOperation', cause: e instanceof Error ? e : undefined }
      )
    }
  })
