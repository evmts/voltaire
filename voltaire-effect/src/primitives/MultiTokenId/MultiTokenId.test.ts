import { describe, it, expect } from 'vitest'
import * as MultiTokenId from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('MultiTokenId', () => {
  const FUNGIBLE_THRESHOLD = 2n ** 128n

  describe('Schema', () => {
    it('decodes from bigint', () => {
      const result = Schema.decodeSync(MultiTokenId.Schema)(1n)
      expect(result).toBe(1n)
    })

    it('decodes from number', () => {
      const result = Schema.decodeSync(MultiTokenId.Schema)(42)
      expect(result).toBe(42n)
    })

    it('decodes from hex string', () => {
      const result = Schema.decodeSync(MultiTokenId.Schema)('0xff')
      expect(result).toBe(255n)
    })

    it('handles large values (NFT range)', () => {
      const nftId = FUNGIBLE_THRESHOLD + 1n
      const result = Schema.decodeSync(MultiTokenId.Schema)(nftId)
      expect(result).toBe(nftId)
    })

    it('fails on negative value', () => {
      expect(() => Schema.decodeSync(MultiTokenId.Schema)(-1n)).toThrow()
    })
  })

  describe('from', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(MultiTokenId.from(123n))
      expect(result).toBe(123n)
    })

    it('creates fungible token id', async () => {
      const result = await Effect.runPromise(MultiTokenId.from(1n))
      expect(result).toBe(1n)
    })

    it('creates non-fungible token id', async () => {
      const nftId = FUNGIBLE_THRESHOLD + 1n
      const result = await Effect.runPromise(MultiTokenId.from(nftId))
      expect(result).toBe(nftId)
    })

    it('handles max uint256', async () => {
      const max = 2n ** 256n - 1n
      const result = await Effect.runPromise(MultiTokenId.from(max))
      expect(result).toBe(max)
    })

    it('fails on negative', async () => {
      const result = await Effect.runPromiseExit(MultiTokenId.from(-1))
      expect(result._tag).toBe('Failure')
    })

    it('fails on overflow', async () => {
      const result = await Effect.runPromiseExit(MultiTokenId.from(2n ** 256n))
      expect(result._tag).toBe('Failure')
    })
  })

  describe('fromHex', () => {
    it('creates from hex string', async () => {
      const result = await Effect.runPromise(MultiTokenId.fromHex('0x1'))
      expect(result).toBe(1n)
    })

    it('creates from large hex (NFT range)', async () => {
      const nftHex = '0x' + '1' + '0'.repeat(32)
      const result = await Effect.runPromise(MultiTokenId.fromHex(nftHex))
      expect(typeof result).toBe('bigint')
      expect(result > 0n).toBe(true)
    })
  })

  describe('isValidFungible', () => {
    it('returns true for fungible token id', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(100n))
      const result = await Effect.runPromise(MultiTokenId.isValidFungible(tokenId))
      expect(result).toBe(true)
    })

    it('returns false for non-fungible token id', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(FUNGIBLE_THRESHOLD + 1n))
      const result = await Effect.runPromise(MultiTokenId.isValidFungible(tokenId))
      expect(result).toBe(false)
    })

    it('returns false for zero (must be > 0)', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(0n))
      const result = await Effect.runPromise(MultiTokenId.isValidFungible(tokenId))
      expect(result).toBe(false)
    })

    it('returns true for threshold - 1', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(FUNGIBLE_THRESHOLD - 1n))
      const result = await Effect.runPromise(MultiTokenId.isValidFungible(tokenId))
      expect(result).toBe(true)
    })
  })

  describe('isValidNonFungible', () => {
    it('returns true for non-fungible token id', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(FUNGIBLE_THRESHOLD + 1n))
      const result = await Effect.runPromise(MultiTokenId.isValidNonFungible(tokenId))
      expect(result).toBe(true)
    })

    it('returns false for fungible token id', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(100n))
      const result = await Effect.runPromise(MultiTokenId.isValidNonFungible(tokenId))
      expect(result).toBe(false)
    })

    it('returns false for zero', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(0n))
      const result = await Effect.runPromise(MultiTokenId.isValidNonFungible(tokenId))
      expect(result).toBe(false)
    })

    it('returns true for max uint256', async () => {
      const tokenId = await Effect.runPromise(MultiTokenId.from(2n ** 256n - 1n))
      const result = await Effect.runPromise(MultiTokenId.isValidNonFungible(tokenId))
      expect(result).toBe(true)
    })
  })
})
