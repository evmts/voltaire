import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { PublicClientService, PublicClientError } from './PublicClientService.js'
import { PublicClient } from './PublicClient.js'
import { TransportService, TransportError } from '../Transport/TransportService.js'

const mockTransport = (responses: Record<string, unknown>) =>
  Layer.succeed(TransportService, {
    request: <T>(method: string, _params?: unknown[]) =>
      Effect.try({
        try: () => {
          if (method in responses) return responses[method] as T
          throw new Error(`Unknown method: ${method}`)
        },
        catch: (e) => new TransportError({ code: -32603, message: (e as Error).message })
      })
  })

describe('PublicClientService', () => {
  describe('getBlockNumber', () => {
    it('returns block number as bigint', async () => {
      const transport = mockTransport({ eth_blockNumber: '0x10' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockNumber()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(16n)
    })
  })

  describe('getBalance', () => {
    it('returns balance as bigint', async () => {
      const transport = mockTransport({ eth_getBalance: '0xde0b6b3a7640000' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance('0x1234567890123456789012345678901234567890')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(1000000000000000000n)
    })
  })

  describe('getBlock', () => {
    it('returns block by tag', async () => {
      const mockBlock = {
        number: '0x10',
        hash: '0xabc',
        parentHash: '0xdef',
        nonce: '0x0',
        sha3Uncles: '0x0',
        logsBloom: '0x0',
        transactionsRoot: '0x0',
        stateRoot: '0x0',
        receiptsRoot: '0x0',
        miner: '0x0',
        difficulty: '0x0',
        totalDifficulty: '0x0',
        extraData: '0x',
        size: '0x0',
        gasLimit: '0x0',
        gasUsed: '0x0',
        timestamp: '0x0',
        transactions: [],
        uncles: []
      }
      const transport = mockTransport({ eth_getBlockByNumber: mockBlock })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlock({ blockTag: 'latest' })
        }).pipe(Effect.provide(layer))
      )

      expect(result.number).toBe('0x10')
      expect(result.hash).toBe('0xabc')
    })
  })

  describe('getTransactionCount', () => {
    it('returns nonce as number', async () => {
      const transport = mockTransport({ eth_getTransactionCount: '0x5' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getTransactionCount('0x1234567890123456789012345678901234567890')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(5)
    })
  })

  describe('getCode', () => {
    it('returns contract bytecode', async () => {
      const transport = mockTransport({ eth_getCode: '0x6080604052' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getCode('0x1234567890123456789012345678901234567890')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe('0x6080604052')
    })
  })

  describe('getStorageAt', () => {
    it('returns storage slot value', async () => {
      const transport = mockTransport({ eth_getStorageAt: '0x0000000000000000000000000000000000000000000000000000000000000001' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getStorageAt('0x1234567890123456789012345678901234567890', '0x0')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe('0x0000000000000000000000000000000000000000000000000000000000000001')
    })
  })

  describe('getChainId', () => {
    it('returns chain ID as number', async () => {
      const transport = mockTransport({ eth_chainId: '0x1' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getChainId()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(1)
    })
  })

  describe('getGasPrice', () => {
    it('returns gas price as bigint', async () => {
      const transport = mockTransport({ eth_gasPrice: '0x3b9aca00' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getGasPrice()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(1000000000n)
    })
  })

  describe('call', () => {
    it('returns call result', async () => {
      const transport = mockTransport({ eth_call: '0x0000000000000000000000000000000000000000000000000000000000000001' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.call({ to: '0x1234567890123456789012345678901234567890', data: '0x' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe('0x0000000000000000000000000000000000000000000000000000000000000001')
    })
  })

  describe('estimateGas', () => {
    it('returns gas estimate as bigint', async () => {
      const transport = mockTransport({ eth_estimateGas: '0x5208' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.estimateGas({ to: '0x1234567890123456789012345678901234567890' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(21000n)
    })
  })

  describe('getLogs', () => {
    it('returns logs array', async () => {
      const mockLogs = [
        {
          address: '0x1234567890123456789012345678901234567890',
          topics: ['0xabc'],
          data: '0x',
          blockNumber: '0x10',
          transactionHash: '0xdef',
          transactionIndex: '0x0',
          blockHash: '0xghi',
          logIndex: '0x0',
          removed: false
        }
      ]
      const transport = mockTransport({ eth_getLogs: mockLogs })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getLogs({ address: '0x1234567890123456789012345678901234567890' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toHaveLength(1)
      expect(result[0].address).toBe('0x1234567890123456789012345678901234567890')
    })
  })

  describe('error handling', () => {
    it('returns PublicClientError on failure', async () => {
      const transport = Layer.succeed(TransportService, {
        request: <T>(_method: string) =>
          Effect.fail(new TransportError({ code: -32603, message: 'Connection failed' })) as Effect.Effect<T, TransportError>
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockNumber()
        }).pipe(Effect.provide(layer))
      )

      expect(result._tag).toBe('Failure')
    })
  })
})
