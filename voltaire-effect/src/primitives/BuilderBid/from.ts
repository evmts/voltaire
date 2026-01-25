import { Address } from '@tevm/voltaire'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import type { BuilderBidType } from './BuilderBidSchema.js'

export class BuilderBidError extends Error {
  readonly _tag = 'BuilderBidError'
  constructor(message: string) {
    super(message)
    this.name = 'BuilderBidError'
  }
}

export interface BuilderBidFromParams {
  builderPubkey: Uint8Array | string
  builderAddress: string | Uint8Array
  value: bigint | number | string
  gasLimit: bigint | number | string
  gasUsed: bigint | number | string
  slot: bigint | number | string
  parentHash: Uint8Array | string
  blockHash: Uint8Array | string
  feeRecipient: string | Uint8Array
  timestamp: bigint | number | string
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

export const from = (params: BuilderBidFromParams): Effect.Effect<BuilderBidType, BuilderBidError> =>
  Effect.try({
    try: () => ({
      builderPubkey: hexToBytes(params.builderPubkey),
      builderAddress: toAddress(params.builderAddress),
      value: BigInt(params.value),
      gasLimit: BigInt(params.gasLimit),
      gasUsed: BigInt(params.gasUsed),
      slot: BigInt(params.slot),
      parentHash: hexToBytes(params.parentHash),
      blockHash: hexToBytes(params.blockHash),
      feeRecipient: toAddress(params.feeRecipient),
      timestamp: BigInt(params.timestamp),
    }) as BuilderBidType,
    catch: (e) => new BuilderBidError((e as Error).message)
  })

export const validate = (bid: BuilderBidType): Effect.Effect<void, BuilderBidError> =>
  Effect.try({
    try: () => {
      if (bid.value < 0n) throw new Error('value must be non-negative')
      if (bid.gasLimit <= 0n) throw new Error('gasLimit must be positive')
      if (bid.gasUsed < 0n) throw new Error('gasUsed must be non-negative')
      if (bid.gasUsed > bid.gasLimit) throw new Error('gasUsed cannot exceed gasLimit')
      if (bid.builderPubkey.length !== 48) throw new Error('builderPubkey must be 48 bytes (BLS pubkey)')
      if (bid.parentHash.length !== 32) throw new Error('parentHash must be 32 bytes')
      if (bid.blockHash.length !== 32) throw new Error('blockHash must be 32 bytes')
    },
    catch: (e) => new BuilderBidError((e as Error).message)
  })

export const valuePerGas = (bid: BuilderBidType): Effect.Effect<bigint, BuilderBidError> =>
  Effect.try({
    try: () => {
      if (bid.gasUsed === 0n) throw new Error('Cannot calculate value per gas when gasUsed is 0')
      return bid.value / bid.gasUsed
    },
    catch: (e) => new BuilderBidError((e as Error).message)
  })

export const toHex = (bid: BuilderBidType): Effect.Effect<{
  builderPubkey: string
  builderAddress: string
  value: string
  gasLimit: string
  gasUsed: string
  slot: string
  parentHash: string
  blockHash: string
  feeRecipient: string
  timestamp: string
}, never> =>
  Effect.succeed({
    builderPubkey: '0x' + Array.from(bid.builderPubkey).map(b => b.toString(16).padStart(2, '0')).join(''),
    builderAddress: Address.toHex(bid.builderAddress),
    value: '0x' + bid.value.toString(16),
    gasLimit: '0x' + bid.gasLimit.toString(16),
    gasUsed: '0x' + bid.gasUsed.toString(16),
    slot: '0x' + bid.slot.toString(16),
    parentHash: '0x' + Array.from(bid.parentHash).map(b => b.toString(16).padStart(2, '0')).join(''),
    blockHash: '0x' + Array.from(bid.blockHash).map(b => b.toString(16).padStart(2, '0')).join(''),
    feeRecipient: Address.toHex(bid.feeRecipient),
    timestamp: '0x' + bid.timestamp.toString(16),
  })

export const compareBids = (a: BuilderBidType, b: BuilderBidType): Effect.Effect<number, never> => {
  if (a.value > b.value) return Effect.succeed(1)
  if (a.value < b.value) return Effect.succeed(-1)
  return Effect.succeed(0)
}
