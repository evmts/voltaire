import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as TypedDataEffect from './index.js'

describe('TypedData', () => {
  const validTypedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' }
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' }
      ]
    },
    primaryType: 'Person',
    domain: { name: 'My App', version: '1' },
    message: { name: 'Bob', wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3' }
  }

  describe('TypedDataSchema', () => {
    it('decodes valid typed data input', () => {
      const result = Schema.decodeSync(TypedDataEffect.TypedDataSchema)(validTypedData)
      expect(result.primaryType).toBe('Person')
      expect(result.domain.name).toBe('My App')
      expect(result.message.name).toBe('Bob')
    })

    it('decodes with numeric chainId', () => {
      const input = {
        ...validTypedData,
        domain: { ...validTypedData.domain, chainId: 1 }
      }
      const result = Schema.decodeSync(TypedDataEffect.TypedDataSchema)(input)
      expect(result.domain.chainId).toBe(1)
    })

    it('decodes with string chainId', () => {
      const input = {
        ...validTypedData,
        domain: { ...validTypedData.domain, chainId: '1' }
      }
      const result = Schema.decodeSync(TypedDataEffect.TypedDataSchema)(input)
      expect(result.domain.chainId).toBe(1)
    })

    it('fails for missing types', () => {
      const input = {
        primaryType: 'Person',
        domain: {},
        message: {}
      }
      expect(() => Schema.decodeSync(TypedDataEffect.TypedDataSchema)(input as any)).toThrow()
    })

    it('fails for missing primaryType', () => {
      const input = {
        types: validTypedData.types,
        domain: {},
        message: {}
      }
      expect(() => Schema.decodeSync(TypedDataEffect.TypedDataSchema)(input as any)).toThrow()
    })

    it('encodes typed data back to JSON', () => {
      const decoded = Schema.decodeSync(TypedDataEffect.TypedDataSchema)(validTypedData)
      const encoded = Schema.encodeSync(TypedDataEffect.TypedDataSchema)(decoded)
      expect(encoded.primaryType).toBe('Person')
      expect(encoded.domain.name).toBe('My App')
    })
  })

  describe('from', () => {
    it('creates typed data from object', async () => {
      const result = await Effect.runPromise(TypedDataEffect.from({
        types: {
          EIP712Domain: [{ name: 'name', type: 'string' }],
          Person: [{ name: 'name', type: 'string' }]
        },
        primaryType: 'Person',
        domain: { name: 'My App' },
        message: { name: 'Bob' }
      })) as { primaryType: string; message: { name: string } }
      expect(result.primaryType).toBe('Person')
      expect(result.message.name).toBe('Bob')
    })

    it('creates typed data with chainId', async () => {
      const result = await Effect.runPromise(TypedDataEffect.from({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' }
          ],
          Person: [{ name: 'name', type: 'string' }]
        },
        primaryType: 'Person',
        domain: { name: 'My App', chainId: 1n },
        message: { name: 'Bob' }
      })) as { domain: { chainId: bigint } }
      expect(result.domain.chainId).toBe(1n)
    })
  })
})
