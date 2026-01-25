/**
 * @fileoverview UserOperation factory function for ERC-4337 account abstraction.
 * 
 * This module provides the `from` function for creating validated UserOperations
 * from flexible input types. Unlike the Schema which works with string-encoded
 * JSON-RPC format, this function accepts native JavaScript types directly.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module UserOperation/from
 * @since 0.0.1
 */
import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'
import type { UserOperationType } from './UserOperationSchema.js'

/**
 * Input parameters for creating a UserOperation.
 * 
 * Accepts flexible input types for each field, allowing construction from
 * various sources without manual type conversion.
 * 
 * @example
 * ```typescript
 * const params: UserOperationFromParams = {
 *   sender: '0x1234...',           // hex string
 *   nonce: 0n,                      // bigint
 *   initCode: '0x',                 // hex string
 *   callData: new Uint8Array([...]),// bytes
 *   callGasLimit: 100000,           // number (will be converted to bigint)
 *   verificationGasLimit: '100000', // string (will be converted to bigint)
 *   preVerificationGas: 21000n,     // bigint
 *   maxFeePerGas: 1000000000n,
 *   maxPriorityFeePerGas: 1000000000n,
 *   paymasterAndData: '0x',
 *   signature: '0x...'
 * }
 * ```
 * 
 * @since 0.0.1
 */
export interface UserOperationFromParams {
  sender: string | Uint8Array
  nonce: bigint | number | string
  initCode: Uint8Array | string
  callData: Uint8Array | string
  callGasLimit: bigint | number | string
  verificationGasLimit: bigint | number | string
  preVerificationGas: bigint | number | string
  maxFeePerGas: bigint | number | string
  maxPriorityFeePerGas: bigint | number | string
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
 * Creates a validated UserOperation from input parameters.
 * 
 * This function accepts flexible input types and normalizes them into the
 * canonical UserOperationType format. It validates all inputs and returns
 * an Effect that either succeeds with the UserOperation or fails with a
 * ValidationError.
 * 
 * @description
 * The function handles type coercion for:
 * - Addresses: hex strings or Uint8Array → AddressType
 * - BigInts: bigint, number, or string → bigint
 * - Bytes: hex strings or Uint8Array → Uint8Array
 * 
 * @param params - UserOperation fields with flexible input types
 * @returns Effect containing the validated UserOperation or ValidationError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as UserOperation from 'voltaire-effect/primitives/UserOperation'
 * 
 * const userOp = await Effect.runPromise(UserOperation.from({
 *   sender: '0x1234567890123456789012345678901234567890',
 *   nonce: 0n,
 *   initCode: '0x',
 *   callData: '0xabcdef',
 *   callGasLimit: 100000n,
 *   verificationGasLimit: 100000n,
 *   preVerificationGas: 21000n,
 *   maxFeePerGas: 1000000000n,
 *   maxPriorityFeePerGas: 1000000000n,
 *   paymasterAndData: '0x',
 *   signature: '0x...'
 * }))
 * ```
 * 
 * @throws ValidationError - When input validation fails (invalid address format, etc.)
 * @see UserOperationType - The output type
 * @see UserOperationFromParams - The input parameter type
 * @since 0.0.1
 */
export const from = (params: UserOperationFromParams): Effect.Effect<UserOperationType, ValidationError> =>
  Effect.try({
    try: () => ({
      sender: Address(params.sender as string | number | bigint | Uint8Array),
      nonce: toBigInt(params.nonce),
      initCode: hexToBytes(params.initCode),
      callData: hexToBytes(params.callData),
      callGasLimit: toBigInt(params.callGasLimit),
      verificationGasLimit: toBigInt(params.verificationGasLimit),
      preVerificationGas: toBigInt(params.preVerificationGas),
      maxFeePerGas: toBigInt(params.maxFeePerGas),
      maxPriorityFeePerGas: toBigInt(params.maxPriorityFeePerGas),
      paymasterAndData: hexToBytes(params.paymasterAndData),
      signature: hexToBytes(params.signature),
    }) as UserOperationType,
    catch: (e) => {
      if (e instanceof ValidationError) return e
      return new ValidationError(
        e instanceof Error ? e.message : String(e),
        { value: params, expected: 'valid UserOperation', cause: e instanceof Error ? e : undefined }
      )
    }
  })
