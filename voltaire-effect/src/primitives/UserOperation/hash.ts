/**
 * @fileoverview UserOperation hash computation for ERC-4337 account abstraction.
 * 
 * This module computes the hash of a UserOperation as defined in ERC-4337.
 * The hash is used for signature verification and uniquely identifies the
 * UserOperation on a specific chain and EntryPoint.
 * 
 * The hash is computed as:
 * `keccak256(keccak256(userOpFields), entryPoint, chainId)`
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#useroperation
 * @module UserOperation/hash
 * @since 0.0.1
 */
import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import { Keccak256 } from '@tevm/voltaire'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'
import type { UserOperationType } from './UserOperationSchema.js'

/**
 * Pads bytes to 32 bytes (right-aligned).
 * @internal
 */
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
 * Computes the ERC-4337 UserOperation hash.
 * 
 * The hash is used for signature verification and uniquely identifies
 * the UserOperation on a specific chain and EntryPoint. This is the value
 * that should be signed by the account owner.
 * 
 * @description
 * The hash is computed in two steps:
 * 1. Hash the UserOperation fields (sender, nonce, initCode hash, callData hash,
 *    gas limits, and paymasterAndData hash)
 * 2. Hash the result with the EntryPoint address and chainId
 * 
 * This provides replay protection across chains and EntryPoint versions.
 * 
 * @param userOp - UserOperation to hash
 * @param entryPoint - EntryPoint contract address (accepts string, Uint8Array, or AddressType)
 * @param chainId - Chain ID for replay protection (accepts bigint or number)
 * @returns Effect containing the 32-byte hash or ValidationError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as UserOperation from 'voltaire-effect/primitives/UserOperation'
 * 
 * const program = Effect.gen(function* () {
 *   const userOp = yield* UserOperation.from({ ... })
 *   const hash = yield* UserOperation.hash(
 *     userOp,
 *     '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // v0.6 EntryPoint
 *     1n // mainnet
 *   )
 *   return hash // 32-byte Uint8Array to sign
 * })
 * ```
 * 
 * @throws ValidationError - When entryPoint address is invalid
 * @see pack - For converting to PackedUserOperation format
 * @since 0.0.1
 */
export const hash = (
  userOp: UserOperationType,
  entryPoint: number | bigint | string | Uint8Array | AddressType,
  chainId: bigint | number
): Effect.Effect<Uint8Array, ValidationError> =>
  Effect.try({
    try: () => {
      const entryPointAddr = Address(entryPoint as string | number | bigint | Uint8Array)
      const chainIdBigInt = typeof chainId === 'bigint' ? chainId : BigInt(chainId)
      const chainIdBytes = uint256ToBytes(chainIdBigInt)

      const parts = [
        pad32(userOp.sender),
        uint256ToBytes(userOp.nonce),
        Keccak256.hash(userOp.initCode),
        Keccak256.hash(userOp.callData),
        uint256ToBytes(userOp.callGasLimit),
        uint256ToBytes(userOp.verificationGasLimit),
        uint256ToBytes(userOp.preVerificationGas),
        uint256ToBytes(userOp.maxFeePerGas),
        uint256ToBytes(userOp.maxPriorityFeePerGas),
        Keccak256.hash(userOp.paymasterAndData),
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
        { value: { userOp, entryPoint, chainId }, expected: 'valid hash inputs', cause: e instanceof Error ? e : undefined }
      )
    }
  })
