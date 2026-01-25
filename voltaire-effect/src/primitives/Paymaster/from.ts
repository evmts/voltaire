import { Address } from '@tevm/voltaire'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import type { PaymasterType } from './PaymasterSchema.js'

export class PaymasterError extends Error {
  readonly _tag = 'PaymasterError'
  constructor(message: string) {
    super(message)
    this.name = 'PaymasterError'
  }
}

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

export const toPaymasterAndData = (paymaster: PaymasterType): Effect.Effect<Uint8Array, never> => {
  const combined = new Uint8Array(paymaster.address.length + paymaster.data.length)
  combined.set(paymaster.address, 0)
  combined.set(paymaster.data, paymaster.address.length)
  return Effect.succeed(combined)
}

export const isZeroAddress = (paymaster: PaymasterType): Effect.Effect<boolean, never> => {
  for (let i = 0; i < paymaster.address.length; i++) {
    if (paymaster.address[i] !== 0) return Effect.succeed(false)
  }
  return Effect.succeed(true)
}
