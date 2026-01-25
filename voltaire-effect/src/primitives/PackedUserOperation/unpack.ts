/**
 * @module PackedUserOperation/unpack
 * Unpacks a PackedUserOperation into a full UserOperation.
 * @since 0.0.1
 */
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'
import type { PackedUserOperationType } from './PackedUserOperationSchema.js'
import type { UserOperationType } from '../UserOperation/UserOperationSchema.js'

const bytesToUint128 = (bytes: Uint8Array, offset: number): bigint => {
  let result = 0n
  for (let i = 0; i < 16; i++) {
    result = (result << 8n) | BigInt(bytes[offset + i] ?? 0)
  }
  return result
}

/**
 * Unpacks a PackedUserOperation into a full UserOperation.
 *
 * Extracts the packed gas fields (accountGasLimits, gasFees) into
 * their individual components (verificationGasLimit, callGasLimit,
 * maxPriorityFeePerGas, maxFeePerGas).
 *
 * @param packedUserOp - The packed user operation to unpack
 * @returns Effect that succeeds with UserOperationType or fails with ValidationError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { unpack, from } from 'voltaire-effect/primitives/PackedUserOperation'
 *
 * const program = Effect.gen(function* () {
 *   const packed = yield* from({ ... })
 *   const userOp = yield* unpack(packed)
 *   console.log(userOp.callGasLimit) // extracted from accountGasLimits
 *   console.log(userOp.maxFeePerGas) // extracted from gasFees
 * })
 * ```
 *
 * @since 0.0.1
 */
export const unpack = (
  packedUserOp: PackedUserOperationType
): Effect.Effect<UserOperationType, ValidationError> =>
  Effect.try({
    try: () => {
      const verificationGasLimit = bytesToUint128(packedUserOp.accountGasLimits, 0)
      const callGasLimit = bytesToUint128(packedUserOp.accountGasLimits, 16)
      const maxPriorityFeePerGas = bytesToUint128(packedUserOp.gasFees, 0)
      const maxFeePerGas = bytesToUint128(packedUserOp.gasFees, 16)

      return {
        sender: packedUserOp.sender,
        nonce: packedUserOp.nonce,
        initCode: packedUserOp.initCode,
        callData: packedUserOp.callData,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas: packedUserOp.preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymasterAndData: packedUserOp.paymasterAndData,
        signature: packedUserOp.signature,
      } as UserOperationType
    },
    catch: (e) => {
      if (e instanceof ValidationError) return e
      return new ValidationError(
        e instanceof Error ? e.message : String(e),
        { value: packedUserOp, expected: 'valid PackedUserOperation', cause: e instanceof Error ? e : undefined }
      )
    }
  })
