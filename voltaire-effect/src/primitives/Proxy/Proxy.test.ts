import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Proxy from './index.js'

describe('Proxy', () => {
  const mockAddr = '0x1234567890123456789012345678901234567890'

  describe('Schema', () => {
    it('validates 32 byte array', () => {
      const slot = new Uint8Array(32)
      const result = S.is(Proxy.Schema)(slot)
      expect(result).toBe(true)
    })

    it('rejects wrong size', () => {
      const slot = new Uint8Array(20)
      const result = S.is(Proxy.Schema)(slot)
      expect(result).toBe(false)
    })
  })

  describe('isErc1167', () => {
    it('returns false for non-proxy bytecode', async () => {
      const result = await Effect.runPromise(Proxy.isErc1167('0x60806040'))
      expect(result).toBe(false)
    })
  })

  describe('generateErc1167', () => {
    it('generates proxy bytecode', async () => {
      const result = await Effect.runPromise(Proxy.generateErc1167(mockAddr))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
