import { describe, it, expect } from 'vitest'
import { Address as VoltaireAddress } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Address from './index.js'
import { KeccakLive } from '../../crypto/Keccak256/index.js'

describe('Address', () => {
  describe('AddressSchema', () => {
    it('decodes valid hex string to AddressType', () => {
      const result = Schema.decodeSync(Address.AddressSchema)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(Address.AddressSchema)('invalid')).toThrow()
    })

    it('fails for wrong length', () => {
      expect(() => Schema.decodeSync(Address.AddressSchema)('0x1234')).toThrow()
    })

    it('encodes AddressType back to string', () => {
      const addr = VoltaireAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
      const result = Schema.encodeSync(Address.AddressSchema)(addr)
      expect(typeof result).toBe('string')
    })

    it('encode returns ParseResult.fail on invalid input instead of throwing', async () => {
      const invalidAddr = new Uint8Array(19) as any // wrong length
      const exit = await Effect.runPromiseExit(Schema.encode(Address.AddressSchema)(invalidAddr))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('AddressFromBytesSchema', () => {
    it('decodes 20-byte Uint8Array to AddressType', () => {
      const bytes = new Uint8Array(20).fill(0xab)
      const result = Schema.decodeSync(Address.AddressFromBytesSchema)(bytes)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })

    it('fails for wrong byte length', () => {
      const bytes = new Uint8Array(19)
      expect(() => Schema.decodeSync(Address.AddressFromBytesSchema)(bytes)).toThrow()
    })

    it('encodes AddressType back to bytes', () => {
      const addr = VoltaireAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
      const result = Schema.encodeSync(Address.AddressFromBytesSchema)(addr)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })
  })

  describe('ChecksummedAddressSchema', () => {
    it('decodes AddressType to checksummed string with KeccakService', async () => {
      const addr = VoltaireAddress('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
      const program = Schema.decode(Address.ChecksummedAddressSchema)(addr).pipe(
        Effect.provide(KeccakLive)
      )
      const result = await Effect.runPromise(program)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
      expect(result.length).toBe(42)
    })

    it('encodes checksummed string back to AddressType', async () => {
      const program = Schema.encode(Address.ChecksummedAddressSchema)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3').pipe(
        Effect.provide(KeccakLive)
      )
      const result = await Effect.runPromise(program)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })
  })

  describe('from', () => {
    it('creates address from hex string', async () => {
      const result = await Effect.runPromise(Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(Address.from('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromBytes', () => {
    it('creates address from 20 bytes', async () => {
      const bytes = new Uint8Array(20).fill(0xab)
      const result = await Effect.runPromise(Address.fromBytes(bytes))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })

    it('fails for wrong length', async () => {
      const bytes = new Uint8Array(19)
      const exit = await Effect.runPromiseExit(Address.fromBytes(bytes))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('toBytes', () => {
    it('converts address to Uint8Array', () => {
      const addr = VoltaireAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
      const result = Address.toBytes(addr)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })
  })

  describe('toChecksummed', () => {
    it('converts address to checksummed string with KeccakService', async () => {
      const addr = VoltaireAddress('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
      const program = Address.toChecksummed(addr).pipe(
        Effect.provide(KeccakLive)
      )
      const result = await Effect.runPromise(program)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
      expect(result.length).toBe(42)
    })
  })
})
