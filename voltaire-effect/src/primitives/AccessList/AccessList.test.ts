import { describe, it, expect } from 'vitest'
import { AccessList } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as AccessListEffect from './index.js'

describe('AccessList', () => {
  const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
  const validStorageKey = '0x0000000000000000000000000000000000000000000000000000000000000001'

  describe('AccessListSchema', () => {
    it('decodes valid access list input', () => {
      const input = [
        { address: validAddress, storageKeys: [validStorageKey] }
      ]
      const result = Schema.decodeSync(AccessListEffect.AccessListSchema)(input)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(result[0].address).toBeInstanceOf(Uint8Array)
      expect(result[0].storageKeys[0]).toBeInstanceOf(Uint8Array)
    })

    it('decodes empty access list', () => {
      const result = Schema.decodeSync(AccessListEffect.AccessListSchema)([])
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('decodes access list with empty storage keys', () => {
      const input = [{ address: validAddress, storageKeys: [] }]
      const result = Schema.decodeSync(AccessListEffect.AccessListSchema)(input)
      expect(result[0].storageKeys.length).toBe(0)
    })

    it('fails for invalid address', () => {
      const input = [{ address: '0x1234', storageKeys: [] }]
      expect(() => Schema.decodeSync(AccessListEffect.AccessListSchema)(input)).toThrow()
    })

    it('fails for invalid storage key', () => {
      const input = [{ address: validAddress, storageKeys: ['0x1234'] }]
      expect(() => Schema.decodeSync(AccessListEffect.AccessListSchema)(input)).toThrow()
    })

    it('encodes access list back to JSON', () => {
      const input = [{ address: validAddress, storageKeys: [validStorageKey] }]
      const decoded = Schema.decodeSync(AccessListEffect.AccessListSchema)(input)
      const encoded = Schema.encodeSync(AccessListEffect.AccessListSchema)(decoded)
      expect(Array.isArray(encoded)).toBe(true)
      expect(encoded[0].address.toLowerCase()).toBe(validAddress.toLowerCase())
    })
  })

  describe('from', () => {
    it('creates access list from items', async () => {
      const items = AccessList.from([])
      const result = await Effect.runPromise(AccessListEffect.from(items))
      expect(Array.isArray(result)).toBe(true)
    })

    it('creates access list from bytes', async () => {
      const list = AccessList.create()
      const bytes = AccessList.toBytes(list)
      const result = await Effect.runPromise(AccessListEffect.from(bytes))
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('create', () => {
    it('creates empty access list', () => {
      const result = AccessListEffect.create()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })
})
