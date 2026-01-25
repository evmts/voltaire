import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import type { RelayDataType } from './RelayDataSchema.js'

export class RelayDataError extends Error {
  readonly _tag = 'RelayDataError'
  constructor(message: string) {
    super(message)
    this.name = 'RelayDataError'
  }
}

export interface RelayDataFromParams {
  maxFeePerGas: bigint | number | string
  maxPriorityFeePerGas: bigint | number | string
  transactionCalldataGasUsed: bigint | number | string
  relayWorker: string | Uint8Array
  paymaster: string | Uint8Array
  paymasterData: Uint8Array | string
  clientId: bigint | number | string
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

export const from = (params: RelayDataFromParams): Effect.Effect<RelayDataType, RelayDataError> =>
  Effect.try({
    try: () => ({
      maxFeePerGas: BigInt(params.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(params.maxPriorityFeePerGas),
      transactionCalldataGasUsed: BigInt(params.transactionCalldataGasUsed),
      relayWorker: toAddress(params.relayWorker),
      paymaster: toAddress(params.paymaster),
      paymasterData: hexToBytes(params.paymasterData),
      clientId: BigInt(params.clientId),
    }) as RelayDataType,
    catch: (e) => new RelayDataError((e as Error).message)
  })

export const validate = (data: RelayDataType): Effect.Effect<void, RelayDataError> =>
  Effect.try({
    try: () => {
      if (data.maxFeePerGas < 0n) throw new Error('maxFeePerGas must be non-negative')
      if (data.maxPriorityFeePerGas < 0n) throw new Error('maxPriorityFeePerGas must be non-negative')
      if (data.maxPriorityFeePerGas > data.maxFeePerGas) {
        throw new Error('maxPriorityFeePerGas cannot exceed maxFeePerGas')
      }
      if (data.transactionCalldataGasUsed < 0n) throw new Error('transactionCalldataGasUsed must be non-negative')
    },
    catch: (e) => new RelayDataError((e as Error).message)
  })

export const toHex = (data: RelayDataType): Effect.Effect<{
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  transactionCalldataGasUsed: string
  relayWorker: string
  paymaster: string
  paymasterData: string
  clientId: string
}, never> =>
  Effect.succeed({
    maxFeePerGas: '0x' + data.maxFeePerGas.toString(16),
    maxPriorityFeePerGas: '0x' + data.maxPriorityFeePerGas.toString(16),
    transactionCalldataGasUsed: '0x' + data.transactionCalldataGasUsed.toString(16),
    relayWorker: Address.toHex(data.relayWorker),
    paymaster: Address.toHex(data.paymaster),
    paymasterData: '0x' + Array.from(data.paymasterData).map(b => b.toString(16).padStart(2, '0')).join(''),
    clientId: '0x' + data.clientId.toString(16),
  })
