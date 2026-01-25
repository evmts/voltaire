import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { PublicClientService } from '../PublicClient/index.js'
import { PublicClient } from '../PublicClient/index.js'
import { TestTransport } from '../Transport/index.js'
import { MainnetPublicClient, createPublicClient } from './index.js'

describe('presets', () => {
  describe('MainnetPublicClient', () => {
    it('provides composed layer with getChainId', async () => {
      const testLayer = PublicClient.pipe(
        Layer.provide(TestTransport({ eth_chainId: '0x1' }))
      )

      const program = Effect.gen(function* () {
        const client = yield* PublicClientService
        return yield* client.getChainId()
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(program)
      expect(result).toBe(1)
    })

    it('provides composed layer with getBlockNumber', async () => {
      const testLayer = PublicClient.pipe(
        Layer.provide(TestTransport({ eth_blockNumber: '0x1234' }))
      )

      const program = Effect.gen(function* () {
        const client = yield* PublicClientService
        return yield* client.getBlockNumber()
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(program)
      expect(result).toBe(0x1234n)
    })

    it('MainnetPublicClient returns a fully composed layer', () => {
      const layer = MainnetPublicClient('https://eth.example.com')
      expect(layer).toBeDefined()
    })
  })

  describe('createPublicClient', () => {
    it('provides composed layer with getChainId', async () => {
      const testLayer = PublicClient.pipe(
        Layer.provide(TestTransport({ eth_chainId: '0xa4b1' }))
      )

      const program = Effect.gen(function* () {
        const client = yield* PublicClientService
        return yield* client.getChainId()
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(program)
      expect(result).toBe(42161) // Arbitrum chain ID
    })

    it('provides composed layer with getBalance', async () => {
      const testLayer = PublicClient.pipe(
        Layer.provide(TestTransport({ eth_getBalance: '0xde0b6b3a7640000' }))
      )

      const program = Effect.gen(function* () {
        const client = yield* PublicClientService
        return yield* client.getBalance('0x1234567890123456789012345678901234567890')
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(program)
      expect(result).toBe(1000000000000000000n) // 1 ETH
    })

    it('createPublicClient returns a fully composed layer', () => {
      const layer = createPublicClient('https://arb.example.com')
      expect(layer).toBeDefined()
    })
  })
})
