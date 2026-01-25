import { describe, it, expect } from 'vitest'
import * as RelayData from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

const mockWorker = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
const mockPaymaster = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'

describe('RelayDataSchema', () => {
  it('decodes valid relay data', () => {
    const input = {
      maxFeePerGas: '50000000000',
      maxPriorityFeePerGas: '2000000000',
      transactionCalldataGasUsed: '21000',
      relayWorker: mockWorker,
      paymaster: mockPaymaster,
      paymasterData: '0x',
      clientId: '1',
    }
    const result = Schema.decodeSync(RelayData.RelayDataSchema)(input)
    expect(result.maxFeePerGas).toBe(50000000000n)
    expect(result.relayWorker).toBeInstanceOf(Uint8Array)
    expect(result.relayWorker.length).toBe(20)
  })

  it('decodes with bigint inputs', () => {
    const input = {
      maxFeePerGas: 50000000000n,
      maxPriorityFeePerGas: 2000000000n,
      transactionCalldataGasUsed: 21000n,
      relayWorker: mockWorker,
      paymaster: mockPaymaster,
      paymasterData: '0xabcd',
      clientId: 1n,
    }
    const result = Schema.decodeSync(RelayData.RelayDataSchema)(input)
    expect(result.maxFeePerGas).toBe(50000000000n)
    expect(result.paymasterData).toEqual(new Uint8Array([0xab, 0xcd]))
  })

  it('fails for invalid relayWorker address', () => {
    expect(() => Schema.decodeSync(RelayData.RelayDataSchema)({
      maxFeePerGas: '50000000000',
      maxPriorityFeePerGas: '2000000000',
      transactionCalldataGasUsed: '21000',
      relayWorker: 'invalid',
      paymaster: mockPaymaster,
      paymasterData: '0x',
      clientId: '1',
    })).toThrow()
  })
})

describe('RelayData.from', () => {
  it('creates from params', async () => {
    const result = await Effect.runPromise(RelayData.from({
      maxFeePerGas: 50000000000n,
      maxPriorityFeePerGas: 2000000000n,
      transactionCalldataGasUsed: 21000n,
      relayWorker: mockWorker,
      paymaster: mockPaymaster,
      paymasterData: '0x',
      clientId: 1n,
    }))
    expect(result.maxFeePerGas).toBe(50000000000n)
    expect(result.relayWorker).toBeInstanceOf(Uint8Array)
  })

  it('handles Uint8Array addresses', async () => {
    const workerBytes = new Uint8Array(20).fill(0xab)
    const paymasterBytes = new Uint8Array(20).fill(0xcd)
    const result = await Effect.runPromise(RelayData.from({
      maxFeePerGas: 50000000000n,
      maxPriorityFeePerGas: 2000000000n,
      transactionCalldataGasUsed: 21000n,
      relayWorker: workerBytes,
      paymaster: paymasterBytes,
      paymasterData: new Uint8Array([0x12, 0x34]),
      clientId: 1n,
    }))
    expect(result.relayWorker).toEqual(workerBytes)
    expect(result.paymaster).toEqual(paymasterBytes)
  })
})

describe('RelayData.validate', () => {
  it('succeeds for valid relay data', async () => {
    const data = await Effect.runPromise(RelayData.from({
      maxFeePerGas: 50000000000n,
      maxPriorityFeePerGas: 2000000000n,
      transactionCalldataGasUsed: 21000n,
      relayWorker: mockWorker,
      paymaster: mockPaymaster,
      paymasterData: '0x',
      clientId: 1n,
    }))
    await expect(Effect.runPromise(RelayData.validate(data))).resolves.toBeUndefined()
  })

  it('fails for negative maxFeePerGas', async () => {
    const data = {
      maxFeePerGas: -1n,
      maxPriorityFeePerGas: 2000000000n,
      transactionCalldataGasUsed: 21000n,
      relayWorker: new Uint8Array(20),
      paymaster: new Uint8Array(20),
      paymasterData: new Uint8Array(0),
      clientId: 1n,
    } as RelayData.RelayDataType
    const result = await Effect.runPromiseExit(RelayData.validate(data))
    expect(result._tag).toBe('Failure')
  })

  it('fails when maxPriorityFeePerGas exceeds maxFeePerGas', async () => {
    const data = {
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 2000000000n,
      transactionCalldataGasUsed: 21000n,
      relayWorker: new Uint8Array(20),
      paymaster: new Uint8Array(20),
      paymasterData: new Uint8Array(0),
      clientId: 1n,
    } as RelayData.RelayDataType
    const result = await Effect.runPromiseExit(RelayData.validate(data))
    expect(result._tag).toBe('Failure')
  })
})

describe('RelayData.toHex', () => {
  it('converts to hex representation', async () => {
    const data = await Effect.runPromise(RelayData.from({
      maxFeePerGas: 50000000000n,
      maxPriorityFeePerGas: 2000000000n,
      transactionCalldataGasUsed: 21000n,
      relayWorker: mockWorker,
      paymaster: mockPaymaster,
      paymasterData: '0xabcd',
      clientId: 1n,
    }))
    const hex = await Effect.runPromise(RelayData.toHex(data))
    expect(hex.maxFeePerGas.startsWith('0x')).toBe(true)
    expect(hex.relayWorker.startsWith('0x')).toBe(true)
    expect(hex.paymasterData).toBe('0xabcd')
  })
})
