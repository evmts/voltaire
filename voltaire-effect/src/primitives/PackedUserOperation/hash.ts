/**
 * @module PackedUserOperation/hash
 * Computes the ERC-4337 user operation hash for signing.
 * @since 0.0.1
 */
import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import { Keccak256 } from '@tevm/voltaire'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'
import type { PackedUserOperationType } from './PackedUserOperationSchema.js'

const pad32 = (bytes: Uint8Array): Uint8Array => {
  const result = new Uint8Array(32)
  result.set(bytes, 32 - bytes.length)
  return result
}

const uint256ToBytes = (n: bigint): Uint8Array => {
  const hex = n.toString(16).padStart(64, '0')
  const bytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Computes the ERC-4337 user operation hash for signing.
 *
 * The hash is computed as keccak256(userOpHash, entryPoint, chainId) where
 * userOpHash is the keccak256 of the packed user operation fields.
 *
 * @param packedUserOp - The packed user operation to hash
 * @param entryPoint - EntryPoint contract address
 * @param chainId - Chain ID for replay protection
 * @returns Effect that succeeds with 32-byte hash or fails with ValidationError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { hash, from } from 'voltaire-effect/primitives/PackedUserOperation'
 *
 * const program = Effect.gen(function* () {
 *   const packed = yield* from({ ... })
 *   const userOpHash = yield* hash(
 *     packed,
 *     '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
 *     1n // mainnet
 *   )
 *   return userOpHash // 32 bytes to sign
 * })
 * ```
 *
 * @since 0.0.1
 */
export const hash = (
  packedUserOp: PackedUserOperationType,
  entryPoint: number | bigint | string | Uint8Array | AddressType,
  chainId: bigint | number
): Effect.Effect<Uint8Array, ValidationError> =>
  Effect.try({
    try: () => {
      const entryPointAddr = Address(entryPoint as string | number | bigint | Uint8Array)
      const chainIdBigInt = typeof chainId === 'bigint' ? chainId : BigInt(chainId)
      const chainIdBytes = uint256ToBytes(chainIdBigInt)

      const parts = [
        pad32(packedUserOp.sender),
        uint256ToBytes(packedUserOp.nonce),
        Keccak256.hash(packedUserOp.initCode),
        Keccak256.hash(packedUserOp.callData),
        packedUserOp.accountGasLimits,
        uint256ToBytes(packedUserOp.preVerificationGas),
        packedUserOp.gasFees,
        Keccak256.hash(packedUserOp.paymasterAndData),
      ]

      const totalLength = parts.reduce((acc, part) => acc + part.length, 0)
      const packed = new Uint8Array(totalLength)
      let offset = 0
      for (const part of parts) {
        packed.set(part, offset)
        offset += part.length
      }

      const userOpHash = Keccak256.hash(packed)

      const finalPacked = new Uint8Array(32 + 20 + 32)
      finalPacked.set(userOpHash, 0)
      finalPacked.set(entryPointAddr, 32)
      finalPacked.set(pad32(chainIdBytes), 52)

      return Keccak256.hash(finalPacked)
    },
    catch: (e) => {
      if (e instanceof ValidationError) return e
      return new ValidationError(
        e instanceof Error ? e.message : String(e),
        { value: { packedUserOp, entryPoint, chainId }, expected: 'valid hash inputs', cause: e instanceof Error ? e : undefined }
      )
    }
  })
