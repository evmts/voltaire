import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Siwe from './index.js'
import { Address } from '@tevm/voltaire'

describe('Siwe', () => {
  const mockAddr = Address('0x1234567890123456789012345678901234567890')

  describe('SiweMessageSchema', () => {
    it('validates siwe message', () => {
      const msg = {
        domain: 'example.com',
        address: mockAddr,
        uri: 'https://example.com',
        version: '1',
        chainId: 1,
        nonce: 'abc12345',
        issuedAt: new Date().toISOString(),
      }
      const result = S.is(Siwe.SiweMessageSchema)(msg)
      expect(result).toBe(true)
    })

    it('rejects invalid message', () => {
      const invalid = { foo: 'bar' }
      const result = S.is(Siwe.SiweMessageSchema)(invalid)
      expect(result).toBe(false)
    })
  })

  describe('create', () => {
    it('creates siwe message', async () => {
      const result = await Effect.runPromise(Siwe.create({
        domain: 'example.com',
        address: '0x1234567890123456789012345678901234567890',
        uri: 'https://example.com',
        chainId: 1,
      }))
      expect(result.domain).toBe('example.com')
      expect(result.version).toBe('1')
    })
  })

  describe('format', () => {
    it('formats siwe message to string', async () => {
      const msg = await Effect.runPromise(Siwe.create({
        domain: 'example.com',
        address: '0x1234567890123456789012345678901234567890',
        uri: 'https://example.com',
        chainId: 1,
      }))
      const formatted = Siwe.format(msg)
      expect(formatted).toContain('example.com')
    })
  })

  describe('generateNonce', () => {
    it('generates nonce of specified length', () => {
      const nonce = Siwe.generateNonce(16)
      expect(nonce.length).toBe(16)
    })

    it('generates default length nonce', () => {
      const nonce = Siwe.generateNonce()
      expect(nonce.length).toBeGreaterThanOrEqual(8)
    })
  })
})
