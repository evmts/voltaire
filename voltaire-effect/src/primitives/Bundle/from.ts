import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import type { UserOperationType } from '../UserOperation/UserOperationSchema.js'
import type { BundleType } from './BundleSchema.js'

export class BundleError extends Error {
  readonly _tag = 'BundleError'
  constructor(message: string) {
    super(message)
    this.name = 'BundleError'
  }
}

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

export const from = (params: BundleFromParams): Effect.Effect<BundleType, BundleError> =>
  Effect.try({
    try: () => ({
      userOperations: params.userOperations,
      beneficiary: toAddress(params.beneficiary),
      entryPoint: toAddress(params.entryPoint),
    }) as BundleType,
    catch: (e) => new BundleError((e as Error).message)
  })

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

export const size = (bundle: BundleType): Effect.Effect<number, never> =>
  Effect.succeed(bundle.userOperations.length)

export const isEmpty = (bundle: BundleType): Effect.Effect<boolean, never> =>
  Effect.succeed(bundle.userOperations.length === 0)

export const totalGas = (bundle: BundleType): Effect.Effect<bigint, never> => {
  let total = 0n
  for (const op of bundle.userOperations) {
    total += op.callGasLimit + op.verificationGasLimit + op.preVerificationGas
  }
  return Effect.succeed(total)
}

export const add = (
  bundle: BundleType,
  userOp: UserOperationType
): Effect.Effect<BundleType, never> =>
  Effect.succeed({
    ...bundle,
    userOperations: [...bundle.userOperations, userOp],
  })

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
