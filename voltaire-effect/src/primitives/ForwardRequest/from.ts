import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import type { ForwardRequestType } from './ForwardRequestSchema.js'

export class ForwardRequestError extends Error {
  readonly _tag = 'ForwardRequestError'
  constructor(message: string) {
    super(message)
    this.name = 'ForwardRequestError'
  }
}

export interface ForwardRequestFromParams {
  from: string | Uint8Array
  to: string | Uint8Array
  value: bigint | number | string
  gas: bigint | number | string
  nonce: bigint | number | string
  deadline: bigint | number | string
  data: Uint8Array | string
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

export const from = (params: ForwardRequestFromParams): Effect.Effect<ForwardRequestType, ForwardRequestError> =>
  Effect.try({
    try: () => ({
      from: toAddress(params.from),
      to: toAddress(params.to),
      value: BigInt(params.value),
      gas: BigInt(params.gas),
      nonce: BigInt(params.nonce),
      deadline: BigInt(params.deadline),
      data: hexToBytes(params.data),
    }) as ForwardRequestType,
    catch: (e) => new ForwardRequestError((e as Error).message)
  })

export const validate = (req: ForwardRequestType): Effect.Effect<void, ForwardRequestError> =>
  Effect.try({
    try: () => {
      if (req.value < 0n) throw new Error('value must be non-negative')
      if (req.gas <= 0n) throw new Error('gas must be positive')
      if (req.deadline <= 0n) throw new Error('deadline must be positive')
    },
    catch: (e) => new ForwardRequestError((e as Error).message)
  })

export const isExpired = (
  req: ForwardRequestType,
  currentTimestamp: bigint
): Effect.Effect<boolean, never> =>
  Effect.succeed(currentTimestamp > req.deadline)

export const toHex = (req: ForwardRequestType): Effect.Effect<{
  from: string
  to: string
  value: string
  gas: string
  nonce: string
  deadline: string
  data: string
}, never> =>
  Effect.succeed({
    from: Address.toHex(req.from),
    to: Address.toHex(req.to),
    value: '0x' + req.value.toString(16),
    gas: '0x' + req.gas.toString(16),
    nonce: '0x' + req.nonce.toString(16),
    deadline: '0x' + req.deadline.toString(16),
    data: '0x' + Array.from(req.data).map(b => b.toString(16).padStart(2, '0')).join(''),
  })
