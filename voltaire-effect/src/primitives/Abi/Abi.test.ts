import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Abi from './index.js'
import * as VoltaireAbi from '@tevm/voltaire/Abi'

const transferAbiItems = [
  {
    type: 'function' as const,
    name: 'transfer',
    inputs: [
      { type: 'address' as const, name: 'to' },
      { type: 'uint256' as const, name: 'amount' }
    ],
    outputs: [{ type: 'bool' as const, name: 'success' }],
    stateMutability: 'nonpayable' as const
  },
  {
    type: 'function' as const,
    name: 'balanceOf',
    inputs: [{ type: 'address' as const, name: 'account' }],
    outputs: [{ type: 'uint256' as const, name: 'balance' }],
    stateMutability: 'view' as const
  },
  {
    type: 'event' as const,
    name: 'Transfer',
    inputs: [
      { type: 'address' as const, name: 'from', indexed: true },
      { type: 'address' as const, name: 'to', indexed: true },
      { type: 'uint256' as const, name: 'value', indexed: false }
    ]
  }
] as const

const transferAbi = VoltaireAbi.Abi(transferAbiItems)
const abi = transferAbiItems as unknown as Parameters<typeof Abi.encodeFunctionData>[0]

describe('Abi.encodeFunctionData', () => {
  it('encodes function call data', async () => {
    const result = await Effect.runPromise(
      Abi.encodeFunctionData(abi, 'transfer', [
        '0x742d35cc6634c0532925a3b844bc9e7595f251e3',
        100n
      ])
    )
    expect(result).toMatch(/^0x/)
    expect(result.slice(0, 10)).toBe('0xa9059cbb')
  })

  it('fails for non-existent function', async () => {
    const exit = await Effect.runPromiseExit(
      Abi.encodeFunctionData(abi, 'nonExistent', [])
    )
    expect(exit._tag).toBe('Failure')
  })
})

describe('Abi.decodeFunctionData', () => {
  it('decodes function call data', async () => {
    const encoded = await Effect.runPromise(
      Abi.encodeFunctionData(abi, 'transfer', [
        '0x742d35cc6634c0532925a3b844bc9e7595f251e3',
        100n
      ])
    )
    const decoded = await Effect.runPromise(
      Abi.decodeFunctionData(abi, encoded)
    )
    expect(decoded.name).toBe('transfer')
    expect(decoded.params).toHaveLength(2)
  })

  it('fails for data too short', async () => {
    const exit = await Effect.runPromiseExit(
      Abi.decodeFunctionData(abi, '0x1234' as any)
    )
    expect(exit._tag).toBe('Failure')
  })
})

describe('Abi.decodeFunctionResult', () => {
  it('decodes function result', async () => {
    const resultData = new Uint8Array(32)
    resultData[31] = 100
    const decoded = await Effect.runPromise(
      Abi.decodeFunctionResult(transferAbiItems, 'balanceOf', resultData)
    )
    expect(decoded[0]).toBe(100n)
  })

  it('fails for non-existent function', async () => {
    const exit = await Effect.runPromiseExit(
      Abi.decodeFunctionResult(transferAbiItems, 'nonExistent', new Uint8Array(32))
    )
    expect(exit._tag).toBe('Failure')
  })
})

describe('Abi.decodeEventLog', () => {
  it('decodes event log', async () => {
    const valueBytes = new Uint8Array(32)
    valueBytes[31] = 100

    const log = {
      data: valueBytes,
      topics: [
        new Uint8Array([
          0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b,
          0x69, 0xc2, 0xb0, 0x68, 0xfc, 0x37, 0x8d, 0xaa,
          0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
          0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef
        ]),
        new Uint8Array(32).fill(0),
        new Uint8Array(32).fill(0)
      ]
    }
    log.topics[1]![12] = 0x74
    log.topics[1]![13] = 0x2d
    log.topics[2]![12] = 0xa1

    const decoded = await Effect.runPromise(
      Abi.decodeEventLog(abi, log)
    )
    expect(decoded.event).toBe('Transfer')
    expect(decoded.params).toHaveProperty('value')
  })

  it('fails for unknown event', async () => {
    const log = {
      data: new Uint8Array(32),
      topics: [new Uint8Array(32).fill(0xff)]
    }
    const exit = await Effect.runPromiseExit(
      Abi.decodeEventLog(abi, log)
    )
    expect(exit._tag).toBe('Failure')
  })
})

describe('Abi.getFunction', () => {
  it('gets function by name', async () => {
    const fn = await Effect.runPromise(
      Abi.getFunction(transferAbiItems, 'transfer')
    )
    expect(fn.name).toBe('transfer')
    expect(fn.type).toBe('function')
  })

  it('fails for non-existent function', async () => {
    const exit = await Effect.runPromiseExit(
      Abi.getFunction(transferAbiItems, 'nonExistent')
    )
    expect(exit._tag).toBe('Failure')
  })
})

describe('Abi.getEvent', () => {
  it('gets event by name', async () => {
    const event = await Effect.runPromise(
      Abi.getEvent(transferAbiItems, 'Transfer')
    )
    expect(event.name).toBe('Transfer')
    expect(event.type).toBe('event')
  })

  it('fails for non-existent event', async () => {
    const exit = await Effect.runPromiseExit(
      Abi.getEvent(transferAbiItems, 'NonExistent')
    )
    expect(exit._tag).toBe('Failure')
  })
})
