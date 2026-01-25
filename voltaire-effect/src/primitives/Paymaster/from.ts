/**
 * @fileoverview Paymaster functions for ERC-4337 account abstraction.
 * 
 * This module provides Effect-based functions for creating, validating,
 * and working with Paymaster configurations.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#extension-paymasters
 * @module Paymaster/from
 * @since 0.0.1
 */
import { Address } from '@tevm/voltaire'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import type { PaymasterType } from './PaymasterSchema.js'

/**
 * Error thrown when Paymaster operations fail.
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * 
 * const result = Effect.runSync(
 *   Effect.catchTag(Paymaster.from({ ... }), 'PaymasterError', (e) => {
 *     console.error('Paymaster error:', e.message)
 *   })
 * )
 * ```
 * 
 * @since 0.0.1
 */
export class PaymasterError extends Error {
  /** Error discriminator tag for pattern matching */
  readonly _tag = 'PaymasterError'
  
  /**
   * Creates a new PaymasterError.
   * 
   * @param message - Human-readable error message
   */
  constructor(message: string) {
    super(message)
    this.name = 'PaymasterError'
  }
}

/**
 * Input parameters for creating a Paymaster.
 * 
 * Accepts flexible input types for each field.
 * 
 * @example
 * ```typescript
 * const params: PaymasterFromParams = {
 *   address: '0x1234567890123456789012345678901234567890',
 *   data: '0xabcdef',
 *   validUntil: 1700000000n,
 *   validAfter: 1600000000n
 * }
 * ```
 * 
 * @since 0.0.1
 */
export interface PaymasterFromParams {
  address: string | Uint8Array
  data: Uint8Array | string
  validUntil?: bigint | number | string
  validAfter?: bigint | number | string
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

const toAddress = (value: string | Uint8Array): AddressType => {
  if (typeof value === 'string') {
    return Address(value)
  }
  return value as AddressType
}

/**
 * Creates a Paymaster from flexible input parameters.
 * 
 * @description
 * Accepts flexible input types and normalizes them into the canonical
 * PaymasterType format. Validates all inputs and returns an Effect that
 * either succeeds with the Paymaster or fails with a PaymasterError.
 * 
 * @param params - Paymaster input with flexible types
 * @returns Effect that succeeds with PaymasterType or fails with PaymasterError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * 
 * const paymaster = await Effect.runPromise(Paymaster.from({
 *   address: '0x1234567890123456789012345678901234567890',
 *   data: '0xabcdef',
 *   validUntil: 1700000000n
 * }))
 * ```
 * 
 * @throws PaymasterError - When input validation fails
 * @since 0.0.1
 */
export const from = (params: PaymasterFromParams): Effect.Effect<PaymasterType, PaymasterError> =>
  Effect.try({
    try: () => {
      const result: PaymasterType = {
        address: toAddress(params.address),
        data: hexToBytes(params.data),
      }
      if (params.validUntil !== undefined) {
        (result as any).validUntil = BigInt(params.validUntil)
      }
      if (params.validAfter !== undefined) {
        (result as any).validAfter = BigInt(params.validAfter)
      }
      return result
    },
    catch: (e) => new PaymasterError((e as Error).message)
  })

/**
 * Validates a Paymaster configuration.
 * 
 * Checks that time constraints are valid (validAfter < validUntil).
 * 
 * @param paymaster - The Paymaster to validate
 * @returns Effect that succeeds with void or fails with PaymasterError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * 
 * const program = Effect.gen(function* () {
 *   const paymaster = yield* Paymaster.from({ ... })
 *   yield* Paymaster.validate(paymaster)
 * })
 * ```
 * 
 * @throws PaymasterError - When validAfter >= validUntil
 * @since 0.0.1
 */
export const validate = (paymaster: PaymasterType): Effect.Effect<void, PaymasterError> =>
  Effect.try({
    try: () => {
      if (paymaster.validUntil !== undefined && paymaster.validAfter !== undefined) {
        if (paymaster.validAfter >= paymaster.validUntil) {
          throw new Error('validAfter must be less than validUntil')
        }
      }
    },
    catch: (e) => new PaymasterError((e as Error).message)
  })

/**
 * Checks if a Paymaster is valid at the current timestamp.
 * 
 * @description
 * Returns false if:
 * - currentTimestamp < validAfter (not yet valid)
 * - currentTimestamp > validUntil (expired)
 * 
 * @param paymaster - The Paymaster to check
 * @param currentTimestamp - Current Unix timestamp
 * @returns Effect that always succeeds with boolean validity
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * 
 * const valid = Effect.runSync(Paymaster.isValid(paymaster, BigInt(Date.now() / 1000)))
 * ```
 * 
 * @since 0.0.1
 */
export const isValid = (
  paymaster: PaymasterType,
  currentTimestamp: bigint
): Effect.Effect<boolean, never> => {
  if (paymaster.validAfter !== undefined && currentTimestamp < paymaster.validAfter) {
    return Effect.succeed(false)
  }
  if (paymaster.validUntil !== undefined && currentTimestamp > paymaster.validUntil) {
    return Effect.succeed(false)
  }
  return Effect.succeed(true)
}

/**
 * Converts a Paymaster to hex-encoded format.
 * 
 * @param paymaster - The Paymaster to convert
 * @returns Effect yielding hex-encoded Paymaster fields
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * 
 * const hex = Effect.runSync(Paymaster.toHex(paymaster))
 * // { address: '0x...', data: '0x...', validUntil: '0x...' }
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (paymaster: PaymasterType): Effect.Effect<{
  address: string
  data: string
  validUntil?: string
  validAfter?: string
}, never> =>
  Effect.succeed({
    address: Address.toHex(paymaster.address),
    data: '0x' + Array.from(paymaster.data).map(b => b.toString(16).padStart(2, '0')).join(''),
    validUntil: paymaster.validUntil !== undefined ? '0x' + paymaster.validUntil.toString(16) : undefined,
    validAfter: paymaster.validAfter !== undefined ? '0x' + paymaster.validAfter.toString(16) : undefined,
  })

/**
 * Converts a Paymaster to the paymasterAndData format used in UserOperations.
 * 
 * @description
 * Concatenates the paymaster address and data into a single byte array
 * suitable for the paymasterAndData field in a UserOperation.
 * 
 * @param paymaster - The Paymaster to convert
 * @returns Effect yielding the concatenated bytes
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * 
 * const paymasterAndData = Effect.runSync(Paymaster.toPaymasterAndData(paymaster))
 * // Use in UserOperation
 * ```
 * 
 * @since 0.0.1
 */
export const toPaymasterAndData = (paymaster: PaymasterType): Effect.Effect<Uint8Array, never> => {
  const combined = new Uint8Array(paymaster.address.length + paymaster.data.length)
  combined.set(paymaster.address, 0)
  combined.set(paymaster.data, paymaster.address.length)
  return Effect.succeed(combined)
}

/**
 * Checks if a Paymaster has a zero address (no paymaster).
 * 
 * @param paymaster - The Paymaster to check
 * @returns Effect yielding true if address is all zeros
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Paymaster from 'voltaire-effect/primitives/Paymaster'
 * 
 * const isZero = Effect.runSync(Paymaster.isZeroAddress(paymaster))
 * ```
 * 
 * @since 0.0.1
 */
export const isZeroAddress = (paymaster: PaymasterType): Effect.Effect<boolean, never> => {
  for (let i = 0; i < paymaster.address.length; i++) {
    if (paymaster.address[i] !== 0) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}
