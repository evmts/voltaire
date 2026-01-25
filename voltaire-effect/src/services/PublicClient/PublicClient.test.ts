import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { PublicClientService, PublicClientError } from './PublicClientService.js'
import { PublicClient } from './PublicClient.js'
import { TransportService, TransportError } from '../Transport/TransportService.js'
import { TestTransport } from '../Transport/TestTransport.js'
import { Address, Hash, Hex, BrandedAddress, BrandedHash, BrandedHex } from '@tevm/voltaire'
import type { AddressType } from '@tevm/voltaire/Address'
import type { HashType } from '@tevm/voltaire/Hash'
import type { HexType } from '@tevm/voltaire/Hex'

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

type MockHandler = (params: unknown[]) => unknown
type MockResponses = Record<string, unknown | MockHandler>

const mockTransportWithCapture = (responses: MockResponses) =>
  Layer.succeed(TransportService, {
    request: <T>(method: string, params: unknown[] = []) =>
      Effect.gen(function* () {
        if (!(method in responses)) {
          return yield* Effect.fail(new TransportError({ code: -32601, message: `Method not found: ${method}` }))
        }
        const response = responses[method]
        if (typeof response === 'function') {
          const result = response(params)
          if (result instanceof Error) {
            return yield* Effect.fail(new TransportError({ code: -32603, message: result.message }))
          }
          return result as T
        }
        return response as T
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

    it('accepts AddressType branded type', async () => {
      const transport = mockTransport({ eth_getBalance: '0xde0b6b3a7640000' })
      const layer = PublicClient.pipe(Layer.provide(transport))
      const addr = Address('0x1234567890123456789012345678901234567890')

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance(addr)
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
    it('returns nonce as bigint', async () => {
      const transport = mockTransport({ eth_getTransactionCount: '0x5' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getTransactionCount('0x1234567890123456789012345678901234567890')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(5n)
    })

    it('handles large transaction counts correctly (no overflow)', async () => {
      const transport = mockTransport({ eth_getTransactionCount: '0xffffffffffffffff' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getTransactionCount('0x1234567890123456789012345678901234567890')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(18446744073709551615n)
      expect(typeof result).toBe('bigint')
    })
  })

  describe('getBlockTransactionCount', () => {
    it('returns transaction count as bigint', async () => {
      const transport = mockTransport({ eth_getBlockTransactionCountByNumber: '0x10' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockTransactionCount({ blockTag: 'latest' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(16n)
    })

    it('handles large block transaction counts correctly (no overflow)', async () => {
      const transport = mockTransport({ eth_getBlockTransactionCountByNumber: '0xffffffffffffffff' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockTransactionCount({ blockTag: 'latest' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(18446744073709551615n)
      expect(typeof result).toBe('bigint')
    })
  })

  describe('getCode', () => {
    it('returns contract bytecode as HexType', async () => {
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

    it('accepts AddressType branded type', async () => {
      const transport = mockTransport({ eth_getCode: '0x6080604052' })
      const layer = PublicClient.pipe(Layer.provide(transport))
      const addr = Address('0x1234567890123456789012345678901234567890')

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getCode(addr)
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

    it('accepts AddressType branded type', async () => {
      const transport = mockTransport({ eth_getStorageAt: '0x0000000000000000000000000000000000000000000000000000000000000001' })
      const layer = PublicClient.pipe(Layer.provide(transport))
      const addr = Address('0x1234567890123456789012345678901234567890')

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getStorageAt(addr, '0x0')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe('0x0000000000000000000000000000000000000000000000000000000000000001')
    })
  })

  describe('getTransaction', () => {
    it('accepts HashType branded type', async () => {
      const mockTx = {
        hash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        nonce: '0x0',
        blockHash: '0xabc',
        blockNumber: '0x10',
        transactionIndex: '0x0',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        input: '0x'
      }
      const transport = mockTransport({ eth_getTransactionByHash: mockTx })
      const layer = PublicClient.pipe(Layer.provide(transport))
      const txHash = Hash('0x1234567890123456789012345678901234567890123456789012345678901234')

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getTransaction(txHash)
        }).pipe(Effect.provide(layer))
      )

      expect(result.hash).toBe('0x1234567890123456789012345678901234567890123456789012345678901234')
    })
  })

  describe('getTransactionReceipt', () => {
    it('accepts HashType branded type', async () => {
      const mockReceipt = {
        transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        transactionIndex: '0x0',
        blockHash: '0xabc',
        blockNumber: '0x10',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        cumulativeGasUsed: '0x5208',
        gasUsed: '0x5208',
        contractAddress: null,
        logs: [],
        logsBloom: '0x00',
        status: '0x1'
      }
      const transport = mockTransport({ eth_getTransactionReceipt: mockReceipt })
      const layer = PublicClient.pipe(Layer.provide(transport))
      const txHash = Hash('0x1234567890123456789012345678901234567890123456789012345678901234')

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getTransactionReceipt(txHash)
        }).pipe(Effect.provide(layer))
      )

      expect(result.transactionHash).toBe('0x1234567890123456789012345678901234567890123456789012345678901234')
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

    it('fails for chain ID exceeding safe integer range', async () => {
      const transport = mockTransport({ eth_chainId: '0xffffffffffffffff' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getChainId()
        }).pipe(Effect.provide(layer))
      )

      expect(result._tag).toBe('Failure')
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

  describe('waitForTransactionReceipt', () => {
    const mockReceipt = {
      transactionHash: '0xabc',
      transactionIndex: '0x0',
      blockHash: '0xdef',
      blockNumber: '0x10',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      cumulativeGasUsed: '0x5208',
      gasUsed: '0x5208',
      contractAddress: null,
      logs: [],
      logsBloom: '0x0',
      status: '0x1',
      effectiveGasPrice: '0x3b9aca00'
    }

    it('returns receipt when available', async () => {
      const transport = mockTransport({
        eth_getTransactionReceipt: mockReceipt,
        eth_blockNumber: '0x10'
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.waitForTransactionReceipt('0xabc')
        }).pipe(Effect.provide(layer))
      )

      expect(result.transactionHash).toBe('0xabc')
    })

    it('times out when receipt is never available', async () => {
      const transport = mockTransport({
        eth_getTransactionReceipt: null,
        eth_blockNumber: '0x10'
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.waitForTransactionReceipt('0xabc', { timeout: 100 })
        }).pipe(Effect.provide(layer))
      )

      expect(result._tag).toBe('Failure')
      if (result._tag === 'Failure') {
        const error = result.cause
        expect(error._tag).toBe('Fail')
      }
    })

    it('can be interrupted', async () => {
      const transport = mockTransport({
        eth_getTransactionReceipt: null,
        eth_blockNumber: '0x10'
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.waitForTransactionReceipt('0xabc', { timeout: 60000 })
        }).pipe(
          Effect.provide(layer),
          Effect.timeout(50)
        )
      )

      expect(result._tag).toBe('Failure')
      if (result._tag === 'Failure') {
        const cause = result.cause
        expect(cause._tag).toBe('Fail')
      }
    })

    it('waits for confirmations', async () => {
      let callCount = 0
      const transport = Layer.succeed(TransportService, {
        request: <T>(method: string) => {
          if (method === 'eth_getTransactionReceipt') {
            return Effect.succeed(mockReceipt as T)
          }
          if (method === 'eth_blockNumber') {
            callCount++
            const blockNum = callCount < 3 ? '0x10' : '0x12'
            return Effect.succeed(blockNum as T)
          }
          return Effect.fail(new TransportError({ code: -32603, message: 'Unknown method' }))
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.waitForTransactionReceipt('0xabc', { confirmations: 3 })
        }).pipe(Effect.provide(layer))
      )

      expect(result.transactionHash).toBe('0xabc')
      expect(callCount).toBeGreaterThanOrEqual(3)
    })
  })

  describe('RPC params formatting', () => {
    it('getBalance formats address and blockTag correctly', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_getBalance: (params) => {
          capturedParams = params
          return '0x1234'
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance('0x1234567890123456789012345678901234567890', 'pending')
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams).toEqual(['0x1234567890123456789012345678901234567890', 'pending'])
    })

    it('getBalance uses latest as default blockTag', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_getBalance: (params) => {
          capturedParams = params
          return '0x0'
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams).toEqual(['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'latest'])
    })

    it('getBalance converts AddressType to hex', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_getBalance: (params) => {
          capturedParams = params
          return '0x0'
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))
      const addr = Address('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance(addr)
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams[0]).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      expect(capturedParams[1]).toBe('latest')
    })

    it('call formats CallRequest correctly', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_call: (params) => {
          capturedParams = params
          return '0x'
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.call({
            from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            data: '0x12345678',
            value: 1000000000000000000n,
            gas: 21000n
          }, 'earliest')
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams[0]).toEqual({
        from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        data: '0x12345678',
        value: '0xde0b6b3a7640000',
        gas: '0x5208'
      })
      expect(capturedParams[1]).toBe('earliest')
    })

    it('getLogs formats LogFilter correctly', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_getLogs: (params) => {
          capturedParams = params
          return []
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getLogs({
            address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            topics: [
              '0x0000000000000000000000000000000000000000000000000000000000000001',
              null,
              ['0x0000000000000000000000000000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000000000000000000000000000003']
            ],
            fromBlock: '0x100',
            toBlock: 'latest'
          })
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams[0]).toEqual({
        address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        topics: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          null,
          ['0x0000000000000000000000000000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000000000000000000000000000003']
        ],
        fromBlock: '0x100',
        toBlock: 'latest'
      })
    })

    it('getLogs formats multiple addresses', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_getLogs: (params) => {
          capturedParams = params
          return []
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getLogs({
            address: [
              '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
            ]
          })
        }).pipe(Effect.provide(layer))
      )

      expect((capturedParams[0] as Record<string, unknown>).address).toEqual([
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      ])
    })

    it('getStorageAt formats address, slot, and blockTag', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_getStorageAt: (params) => {
          capturedParams = params
          return '0x0'
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getStorageAt(
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            '0x0000000000000000000000000000000000000000000000000000000000000005',
            'finalized'
          )
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams).toEqual([
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '0x0000000000000000000000000000000000000000000000000000000000000005',
        'finalized'
      ])
    })

    it('getBlock formats blockHash correctly', async () => {
      let capturedMethod = ''
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_getBlockByHash: (params) => {
          capturedMethod = 'eth_getBlockByHash'
          capturedParams = params
          return { number: '0x1', hash: '0xabc', transactions: [] }
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlock({
            blockHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
            includeTransactions: true
          })
        }).pipe(Effect.provide(layer))
      )

      expect(capturedMethod).toBe('eth_getBlockByHash')
      expect(capturedParams).toEqual([
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        true
      ])
    })

    it('estimateGas formats CallRequest correctly', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_estimateGas: (params) => {
          capturedParams = params
          return '0x5208'
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.estimateGas({
            to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            value: 0n
          })
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams[0]).toEqual({
        to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        value: '0x0'
      })
    })

    it('getFeeHistory formats params correctly', async () => {
      let capturedParams: unknown[] = []
      const transport = mockTransportWithCapture({
        eth_feeHistory: (params) => {
          capturedParams = params
          return { baseFeePerGas: [], gasUsedRatio: [], reward: [] }
        }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getFeeHistory(10, 'latest', [25, 50, 75])
        }).pipe(Effect.provide(layer))
      )

      expect(capturedParams).toEqual(['0xa', 'latest', [25, 50, 75]])
    })
  })

  describe('error mapping', () => {
    it('TransportError becomes PublicClientError with cause', async () => {
      const transport = mockTransportWithCapture({
        eth_blockNumber: () => { throw new Error('RPC connection failed') }
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockNumber()
        }).pipe(Effect.provide(layer))
      )

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = exit.cause
        expect(error._tag).toBe('Fail')
      }
    })

    it('preserves error message from transport', async () => {
      const transport = Layer.succeed(TransportService, {
        request: <T>(_method: string) =>
          Effect.fail(new TransportError({ code: -32000, message: 'execution reverted: insufficient balance' })) as Effect.Effect<T, TransportError>
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.call({ to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
        }).pipe(Effect.provide(layer))
      )

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
        const error = exit.cause.error as PublicClientError
        expect(error._tag).toBe('PublicClientError')
        expect(error.message).toContain('execution reverted: insufficient balance')
      }
    })

    it('method not found error propagates correctly', async () => {
      const transport = TestTransport({})
      const layer = PublicClient.pipe(Layer.provide(transport))

      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockNumber()
        }).pipe(Effect.provide(layer))
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('error includes method context', async () => {
      const transport = Layer.succeed(TransportService, {
        request: <T>(_method: string) =>
          Effect.fail(new TransportError({ code: -32603, message: 'internal error' })) as Effect.Effect<T, TransportError>
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        }).pipe(Effect.provide(layer))
      )

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
        const error = exit.cause.error as PublicClientError
        expect(error.context).toBeDefined()
        expect((error.context as Record<string, unknown>).method).toBe('eth_getBalance')
      }
    })
  })

  describe('response parsing', () => {
    it('getBlockNumber parses hex to bigint', async () => {
      const transport = TestTransport({ eth_blockNumber: '0x10f2c' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockNumber()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(69420n)
    })

    it('getGasPrice parses hex to bigint', async () => {
      const transport = TestTransport({ eth_gasPrice: '0x4a817c800' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getGasPrice()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(20000000000n)
    })

    it('getChainId parses hex to number', async () => {
      const transport = TestTransport({ eth_chainId: '0xa' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getChainId()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(10)
    })

    it('estimateGas parses hex to bigint', async () => {
      const transport = TestTransport({ eth_estimateGas: '0x5208' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.estimateGas({ to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(21000n)
    })

    it('getMaxPriorityFeePerGas parses hex to bigint', async () => {
      const transport = TestTransport({ eth_maxPriorityFeePerGas: '0x3b9aca00' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getMaxPriorityFeePerGas()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(1000000000n)
    })

    it('getBlockTransactionCount parses hex to bigint', async () => {
      const transport = TestTransport({ eth_getBlockTransactionCountByNumber: '0x64' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockTransactionCount({ blockTag: 'latest' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(100n)
    })

    it('getBlockTransactionCount by hash parses correctly', async () => {
      const transport = TestTransport({ eth_getBlockTransactionCountByHash: '0xc8' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockTransactionCount({
            blockHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
          })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(200n)
    })

    it('getCode returns hex string as-is', async () => {
      const transport = TestTransport({ eth_getCode: '0x608060405234801561001057600080fd5b50' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getCode('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe('0x608060405234801561001057600080fd5b50')
    })

    it('call returns hex string as-is', async () => {
      const transport = TestTransport({ eth_call: '0x0000000000000000000000000000000000000000000000000000000000000064' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.call({ to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', data: '0x18160ddd' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe('0x0000000000000000000000000000000000000000000000000000000000000064')
    })

    it('getLogs returns array of logs', async () => {
      const mockLogs = [
        {
          address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          topics: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
          data: '0x0000000000000000000000000000000000000000000000000000000000000064',
          blockNumber: '0x100',
          transactionHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          transactionIndex: '0x0',
          blockHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
          logIndex: '0x0',
          removed: false
        }
      ]
      const transport = TestTransport({ eth_getLogs: mockLogs })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getLogs({ address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
        }).pipe(Effect.provide(layer))
      )

      expect(result).toHaveLength(1)
      expect(result[0].address).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      expect(result[0].blockNumber).toBe('0x100')
    })

    it('getTransaction returns full transaction object', async () => {
      const mockTx = {
        hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        nonce: '0x5',
        blockHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        blockNumber: '0x100',
        transactionIndex: '0x0',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        value: '0xde0b6b3a7640000',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        input: '0x'
      }
      const transport = TestTransport({ eth_getTransactionByHash: mockTx })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getTransaction('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        }).pipe(Effect.provide(layer))
      )

      expect(result.hash).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      expect(result.nonce).toBe('0x5')
      expect(result.value).toBe('0xde0b6b3a7640000')
    })

    it('getBlock returns full block object', async () => {
      const mockBlock = {
        number: '0x100',
        hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        parentHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        nonce: '0x0',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        logsBloom: '0x00',
        transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        stateRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        miner: '0x0000000000000000000000000000000000000000',
        difficulty: '0x0',
        totalDifficulty: '0x0',
        extraData: '0x',
        size: '0x200',
        gasLimit: '0x1c9c380',
        gasUsed: '0x5208',
        timestamp: '0x64a1b2c3',
        transactions: [],
        uncles: []
      }
      const transport = TestTransport({ eth_getBlockByNumber: mockBlock })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlock({ blockTag: 'latest' })
        }).pipe(Effect.provide(layer))
      )

      expect(result.number).toBe('0x100')
      expect(result.hash).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      expect(result.gasUsed).toBe('0x5208')
    })

    it('handles zero values correctly', async () => {
      const transport = TestTransport({ eth_getBalance: '0x0' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(0n)
    })

    it('handles large bigint values correctly', async () => {
      const transport = TestTransport({ eth_getBalance: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBalance('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(115792089237316195423570985008687907853269984665640564039457584007913129639935n)
    })
  })

  describe('TestTransport integration', () => {
    it('works with TestTransport for getBlockNumber', async () => {
      const transport = TestTransport({ eth_blockNumber: '0x1234' })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.getBlockNumber()
        }).pipe(Effect.provide(layer))
      )

      expect(result).toBe(0x1234n)
    })

    it('works with TestTransport for multiple methods', async () => {
      const transport = TestTransport({
        eth_blockNumber: '0x100',
        eth_chainId: '0x1',
        eth_gasPrice: '0x3b9aca00'
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const [blockNumber, chainId, gasPrice] = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          const block = yield* client.getBlockNumber()
          const chain = yield* client.getChainId()
          const gas = yield* client.getGasPrice()
          return [block, chain, gas] as const
        }).pipe(Effect.provide(layer))
      )

      expect(blockNumber).toBe(256n)
      expect(chainId).toBe(1)
      expect(gasPrice).toBe(1000000000n)
    })

    it('TestTransport simulates TransportError correctly', async () => {
      const transport = TestTransport({
        eth_call: new TransportError({ code: -32000, message: 'execution reverted' })
      })
      const layer = PublicClient.pipe(Layer.provide(transport))

      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const client = yield* PublicClientService
          return yield* client.call({ to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
        }).pipe(Effect.provide(layer))
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
