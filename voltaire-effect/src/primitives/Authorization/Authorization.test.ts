import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as AuthorizationEffect from './index.js'

describe('Authorization', () => {
  const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
  const validR = '0x' + '11'.repeat(32)
  const validS = '0x' + '22'.repeat(32)

  describe('AuthorizationSchema', () => {
    it('decodes valid authorization input', () => {
      const input = {
        chainId: '1',
        address: validAddress,
        nonce: '0',
        yParity: 0,
        r: validR,
        s: validS
      }
      const result = Schema.decodeSync(AuthorizationEffect.AuthorizationSchema)(input)
      expect(result.chainId).toBe(1n)
      expect(result.address).toBeInstanceOf(Uint8Array)
      expect(result.nonce).toBe(0n)
      expect(result.yParity).toBe(0)
      expect(result.r).toBeInstanceOf(Uint8Array)
      expect(result.s).toBeInstanceOf(Uint8Array)
    })

    it('decodes with numeric chainId', () => {
      const input = {
        chainId: 1,
        address: validAddress,
        nonce: 0,
        yParity: 1,
        r: validR,
        s: validS
      }
      const result = Schema.decodeSync(AuthorizationEffect.AuthorizationSchema)(input)
      expect(result.chainId).toBe(1n)
      expect(result.nonce).toBe(0n)
    })

    it('decodes with bigint chainId', () => {
      const input = {
        chainId: 1n,
        address: validAddress,
        nonce: 0n,
        yParity: 0,
        r: validR,
        s: validS
      }
      const result = Schema.decodeSync(AuthorizationEffect.AuthorizationSchema)(input)
      expect(result.chainId).toBe(1n)
    })

    it('fails for invalid address length', () => {
      const input = {
        chainId: '1',
        address: '0x1234',
        nonce: '0',
        yParity: 0,
        r: validR,
        s: validS
      }
      expect(() => Schema.decodeSync(AuthorizationEffect.AuthorizationSchema)(input)).toThrow()
    })

    it('fails for invalid r length', () => {
      const input = {
        chainId: '1',
        address: validAddress,
        nonce: '0',
        yParity: 0,
        r: '0x1234',
        s: validS
      }
      expect(() => Schema.decodeSync(AuthorizationEffect.AuthorizationSchema)(input)).toThrow()
    })

    it('encodes authorization back to JSON', () => {
      const input = {
        chainId: '1',
        address: validAddress,
        nonce: '0',
        yParity: 0,
        r: validR,
        s: validS
      }
      const decoded = Schema.decodeSync(AuthorizationEffect.AuthorizationSchema)(input)
      const encoded = Schema.encodeSync(AuthorizationEffect.AuthorizationSchema)(decoded)
      expect(encoded.chainId).toBe('1')
      expect(encoded.address.toLowerCase()).toBe(validAddress.toLowerCase())
    })
  })

  describe('validate', () => {
    it('validates valid authorization', async () => {
      const auth = {
        chainId: 1n,
        address: hexToBytes(validAddress, 20) as import('@tevm/voltaire/Address').AddressType,
        nonce: 0n,
        yParity: 0,
        r: hexToBytes(validR, 32),
        s: hexToBytes(validS, 32)
      }
      const result = await Effect.runPromise(AuthorizationEffect.validate(auth))
      expect(result).toBe(auth)
    })
  })
})

function hexToBytes(hex: string, length: number): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
