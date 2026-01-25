/**
 * @fileoverview Bundle functions for ERC-4337 account abstraction.
 * 
 * This module provides Effect-based functions for creating and working with
 * Bundles of UserOperations.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module Bundle/from
 * @since 0.0.1
 */
import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import type { UserOperationType } from '../UserOperation/UserOperationSchema.js'
import type { BundleType } from './BundleSchema.js'

/**
 * Error thrown when Bundle operations fail.
 * @since 0.0.1
 */
export class BundleError extends Error {
  /** Error discriminator tag for pattern matching */
  readonly _tag = 'BundleError'
  constructor(message: string) {
    super(message)
    this.name = 'BundleError'
  }
}

/**
 * Input parameters for creating a Bundle.
 * @since 0.0.1
 */
export interface BundleFromParams {
  userOperations: readonly UserOperationType[]
  beneficiary: string | Uint8Array
  entryPoint: string | Uint8Array
}

const toAddress = (value: string | Uint8Array): AddressType => {
  if (typeof value === 'string') {
    return Address(value)
  }
  return value as AddressType
}

/**
 * Creates a Bundle from input parameters.
 * 
 * @param params - Bundle input with UserOperations, beneficiary, and EntryPoint
 * @returns Effect yielding BundleType or failing with BundleError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Bundle from 'voltaire-effect/primitives/Bundle'
 * 
 * const bundle = Effect.runSync(Bundle.from({
 *   userOperations: [userOp1, userOp2],
 *   beneficiary: '0x...',
 *   entryPoint: '0x...'
 * }))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (params: BundleFromParams): Effect.Effect<BundleType, BundleError> =>
  Effect.try({
    try: () => ({
      userOperations: params.userOperations,
      beneficiary: toAddress(params.beneficiary),
      entryPoint: toAddress(params.entryPoint),
    }) as BundleType,
    catch: (e) => new BundleError((e as Error).message)
  })

/**
 * Validates a Bundle.
 * 
 * Checks that the Bundle contains at least one UserOperation
 * and all UserOperations have valid sender addresses.
 * 
 * @param bundle - The Bundle to validate
 * @returns Effect yielding void or failing with BundleError
 * @since 0.0.1
 */
export const validate = (bundle: BundleType): Effect.Effect<void, BundleError> =>
  Effect.try({
    try: () => {
      if (bundle.userOperations.length === 0) {
        throw new Error('Bundle must contain at least one UserOperation')
      }
      for (let i = 0; i < bundle.userOperations.length; i++) {
        const op = bundle.userOperations[i]
        if (!op.sender || op.sender.length !== 20) {
          throw new Error(`UserOperation[${i}] has invalid sender`)
        }
      }
    },
    catch: (e) => new BundleError((e as Error).message)
  })

/**
 * Returns the number of UserOperations in a Bundle.
 * @param bundle - The Bundle
 * @returns Effect yielding the count
 * @since 0.0.1
 */
export const size = (bundle: BundleType): Effect.Effect<number, never> =>
  Effect.succeed(bundle.userOperations.length)

/**
 * Checks if a Bundle is empty.
 * @param bundle - The Bundle
 * @returns Effect yielding true if no UserOperations
 * @since 0.0.1
 */
export const isEmpty = (bundle: BundleType): Effect.Effect<boolean, never> =>
  Effect.succeed(bundle.userOperations.length === 0)

/**
 * Calculates the total gas required for all UserOperations in a Bundle.
 * @param bundle - The Bundle
 * @returns Effect yielding the sum of all gas limits
 * @since 0.0.1
 */
export const totalGas = (bundle: BundleType): Effect.Effect<bigint, never> => {
  let total = 0n
  for (const op of bundle.userOperations) {
    total += op.callGasLimit + op.verificationGasLimit + op.preVerificationGas
  }
  return Effect.succeed(total)
}

/**
 * Adds a UserOperation to a Bundle.
 * @param bundle - The Bundle
 * @param userOp - UserOperation to add
 * @returns Effect yielding new Bundle with added operation
 * @since 0.0.1
 */
export const add = (
  bundle: BundleType,
  userOp: UserOperationType
): Effect.Effect<BundleType, never> =>
  Effect.succeed({
    ...bundle,
    userOperations: [...bundle.userOperations, userOp],
  })

/**
 * Removes a UserOperation from a Bundle by index.
 * @param bundle - The Bundle
 * @param index - Index of UserOperation to remove
 * @returns Effect yielding new Bundle without the operation
 * @throws BundleError - When index is out of bounds
 * @since 0.0.1
 */
export const remove = (
  bundle: BundleType,
  index: number
): Effect.Effect<BundleType, BundleError> =>
  Effect.try({
    try: () => {
      if (index < 0 || index >= bundle.userOperations.length) {
        throw new Error(`Index ${index} out of bounds`)
      }
      const newOps = [...bundle.userOperations]
      newOps.splice(index, 1)
      return {
        ...bundle,
        userOperations: newOps,
      }
    },
    catch: (e) => new BundleError((e as Error).message)
  })
