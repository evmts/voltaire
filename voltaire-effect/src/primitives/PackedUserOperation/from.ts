import { Address } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'
import type { PackedUserOperationType } from './PackedUserOperationSchema.js'

/**
 * Parameters for creating a PackedUserOperation.
 *
 * Accepts flexible input types that are normalized during construction.
 *
 * @since 0.0.1
 */
export interface PackedUserOperationFromParams {
  sender: string | Uint8Array
  nonce: bigint | number | string
  initCode: Uint8Array | string
  callData: Uint8Array | string
  accountGasLimits: Uint8Array | string
  preVerificationGas: bigint | number | string
  gasFees: Uint8Array | string
  paymasterAndData: Uint8Array | string
  signature: Uint8Array | string
}

const hexToBytes = (value: Uint8Array | string): Uint8Array => {
  if (typeof value === 'string') {
    const hex = value.startsWith('0x') ? value.slice(2) : value
    if (hex.length === 0) return new Uint8Array(0)
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
    return bytes
  }
  return value
}

const toBigInt = (value: bigint | number | string): bigint => {
  if (typeof value === 'bigint') return value
  return BigInt(value)
}

/**
 * Creates a PackedUserOperation from flexible input parameters.
 *
 * @param params - PackedUserOperation input with flexible types for addresses, bigints, and byte arrays
 * @returns Effect that succeeds with PackedUserOperationType or fails with ValidationError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/PackedUserOperation'
 *
 * const packed = from({
 *   sender: '0x1234567890123456789012345678901234567890',
 *   nonce: 0n,
 *   initCode: '0x',
 *   callData: '0xabcd',
 *   accountGasLimits: new Uint8Array(32),
 *   preVerificationGas: 21000n,
 *   gasFees: new Uint8Array(32),
 *   paymasterAndData: '0x',
 *   signature: '0x'
 * })
 *
 * Effect.runSync(packed)
 * ```
 *
 * @since 0.0.1
 */
export const from = (params: PackedUserOperationFromParams): Effect.Effect<PackedUserOperationType, ValidationError> =>
  Effect.try({
    try: () => ({
      sender: Address(params.sender as string | number | bigint | Uint8Array),
      nonce: toBigInt(params.nonce),
      initCode: hexToBytes(params.initCode),
      callData: hexToBytes(params.callData),
      accountGasLimits: hexToBytes(params.accountGasLimits),
      preVerificationGas: toBigInt(params.preVerificationGas),
      gasFees: hexToBytes(params.gasFees),
      paymasterAndData: hexToBytes(params.paymasterAndData),
      signature: hexToBytes(params.signature),
    }) as PackedUserOperationType,
    catch: (e) => {
      if (e instanceof ValidationError) return e
      return new ValidationError(
        e instanceof Error ? e.message : String(e),
        { value: params, expected: 'valid PackedUserOperation', cause: e instanceof Error ? e : undefined }
      )
    }
  })
