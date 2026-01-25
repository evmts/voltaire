import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Chain from './index.js'

describe('Chain', () => {
  const validChain: Chain.ChainInput = {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }

  const chainWithRpc: Chain.ChainInput = {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: {
      default: {
        http: ['https://eth.example.com']
      }
    },
    blockExplorers: {
      default: {
        name: 'Etherscan',
        url: 'https://etherscan.io'
      }
    }
  }

  describe('ChainSchema', () => {
    it('decodes valid chain config', () => {
      const result = Schema.decodeSync(Chain.ChainSchema)(validChain)
      expect(result.id).toBe(1)
      expect(result.name).toBe('Ethereum')
      expect(result.nativeCurrency.symbol).toBe('ETH')
    })

    it('decodes chain with rpc and explorer', () => {
      const result = Schema.decodeSync(Chain.ChainSchema)(chainWithRpc)
      expect(result.rpcUrls?.default.http[0]).toBe('https://eth.example.com')
      expect(result.blockExplorers?.default.name).toBe('Etherscan')
    })

    it('fails for invalid chain ID', () => {
      expect(() => Schema.decodeSync(Chain.ChainSchema)({ ...validChain, id: -1 })).toThrow()
    })

    it('fails for zero chain ID', () => {
      expect(() => Schema.decodeSync(Chain.ChainSchema)({ ...validChain, id: 0 })).toThrow()
    })

    it('encodes ChainType back to input', () => {
      const chain = Schema.decodeSync(Chain.ChainSchema)(validChain)
      const result = Schema.encodeSync(Chain.ChainSchema)(chain)
      expect(result.id).toBe(1)
      expect(result.name).toBe('Ethereum')
    })
  })

  describe('from', () => {
    it('creates Chain from valid input', async () => {
      const result = await Effect.runPromise(Chain.from(validChain))
      expect(result.id).toBe(1)
      expect(result.name).toBe('Ethereum')
    })

    it('creates Chain with full config', async () => {
      const result = await Effect.runPromise(Chain.from(chainWithRpc))
      expect(result.rpcUrls?.default.http[0]).toBe('https://eth.example.com')
    })

    it('fails for invalid chain ID', async () => {
      const exit = await Effect.runPromiseExit(Chain.from({ ...validChain, id: -1 }))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for zero chain ID', async () => {
      const exit = await Effect.runPromiseExit(Chain.from({ ...validChain, id: 0 }))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for empty name', async () => {
      const exit = await Effect.runPromiseExit(Chain.from({ ...validChain, name: '' }))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
