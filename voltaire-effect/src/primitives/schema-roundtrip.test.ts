import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Address from './Address/index.js'
import * as Hex from './Hex/index.js'
import * as Hash from './Hash/index.js'
import * as Bytes32 from './Bytes32/index.js'
import * as BlockHash from './BlockHash/index.js'
import * as TransactionHash from './TransactionHash/index.js'
import * as BlockNumber from './BlockNumber/index.js'
import * as ChainId from './ChainId/index.js'

describe('Schema round-trip invariants', () => {
  describe('AddressSchema', () => {
    it('decode(encode(decode(x))) === decode(x)', () => {
      const original = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
      const decoded = Schema.decodeSync(Address.AddressSchema)(original)
      const encoded = Schema.encodeSync(Address.AddressSchema)(decoded)
      const redecoded = Schema.decodeSync(Address.AddressSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('preserves data with different valid inputs', () => {
      const addresses = [
        '0x0000000000000000000000000000000000000000',
        '0xffffffffffffffffffffffffffffffffffffffff',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        '0xdead000000000000000000000000000000000beef',
      ]
      for (const addr of addresses) {
        const decoded = Schema.decodeSync(Address.AddressSchema)(addr)
        const encoded = Schema.encodeSync(Address.AddressSchema)(decoded)
        const redecoded = Schema.decodeSync(Address.AddressSchema)(encoded)
        expect(decoded).toEqual(redecoded)
      }
    })
  })

  describe('HexSchema', () => {
    it('decode(encode(decode(x))) === decode(x)', () => {
      const original = '0xdeadbeef'
      const decoded = Schema.decodeSync(Hex.Schema)(original)
      const encoded = Schema.encodeSync(Hex.Schema)(decoded)
      const redecoded = Schema.decodeSync(Hex.Schema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('preserves data with various hex lengths', () => {
      const hexValues = [
        '0x',
        '0x00',
        '0xdeadbeef',
        '0x' + 'ab'.repeat(32),
        '0x' + 'ff'.repeat(100),
      ]
      for (const hex of hexValues) {
        const decoded = Schema.decodeSync(Hex.Schema)(hex)
        const encoded = Schema.encodeSync(Hex.Schema)(decoded)
        const redecoded = Schema.decodeSync(Hex.Schema)(encoded)
        expect(decoded).toEqual(redecoded)
      }
    })
  })

  describe('HashSchema', () => {
    it('decode(encode(decode(x))) === decode(x)', () => {
      const original = '0x' + 'ab'.repeat(32)
      const decoded = Schema.decodeSync(Hash.HashSchema)(original)
      const encoded = Schema.encodeSync(Hash.HashSchema)(decoded)
      const redecoded = Schema.decodeSync(Hash.HashSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('preserves data with different hash values', () => {
      const hashes = [
        '0x' + '00'.repeat(32),
        '0x' + 'ff'.repeat(32),
        '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
      ]
      for (const hash of hashes) {
        const decoded = Schema.decodeSync(Hash.HashSchema)(hash)
        const encoded = Schema.encodeSync(Hash.HashSchema)(decoded)
        const redecoded = Schema.decodeSync(Hash.HashSchema)(encoded)
        expect(decoded).toEqual(redecoded)
      }
    })
  })

  describe('Bytes32Schema', () => {
    it('decode(encode(decode(x))) === decode(x) for hex string', () => {
      const original = '0x' + 'ab'.repeat(32)
      const decoded = Schema.decodeSync(Bytes32.Schema)(original)
      const encoded = Schema.encodeSync(Bytes32.Schema)(decoded)
      expect(decoded).toEqual(encoded)
    })

    it('decode(encode(decode(x))) === decode(x) for bigint', () => {
      const original = 12345n
      const decoded = Schema.decodeSync(Bytes32.Schema)(original)
      const encoded = Schema.encodeSync(Bytes32.Schema)(decoded)
      expect(decoded).toEqual(encoded)
    })

    it('preserves 32-byte data', () => {
      const values: (string | bigint | number)[] = [
        '0x' + '00'.repeat(32),
        '0x' + 'ff'.repeat(32),
        0n,
        1n,
        2n ** 256n - 1n,
        0,
        42,
      ]
      for (const val of values) {
        const decoded = Schema.decodeSync(Bytes32.Schema)(val)
        expect(decoded.length).toBe(32)
        const encoded = Schema.encodeSync(Bytes32.Schema)(decoded)
        expect(encoded).toEqual(decoded)
      }
    })
  })

  describe('BlockHashSchema', () => {
    it('decode(encode(decode(x))) === decode(x)', () => {
      const original = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'
      const decoded = Schema.decodeSync(BlockHash.BlockHashSchema)(original)
      const encoded = Schema.encodeSync(BlockHash.BlockHashSchema)(decoded)
      const redecoded = Schema.decodeSync(BlockHash.BlockHashSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('preserves data with various block hashes', () => {
      const blockHashes = [
        '0x' + '00'.repeat(32),
        '0x' + 'ff'.repeat(32),
        '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
      ]
      for (const hash of blockHashes) {
        const decoded = Schema.decodeSync(BlockHash.BlockHashSchema)(hash)
        const encoded = Schema.encodeSync(BlockHash.BlockHashSchema)(decoded)
        const redecoded = Schema.decodeSync(BlockHash.BlockHashSchema)(encoded)
        expect(decoded).toEqual(redecoded)
      }
    })
  })

  describe('TransactionHashSchema', () => {
    it('decode(encode(decode(x))) === decode(x)', () => {
      const original = '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'
      const decoded = Schema.decodeSync(TransactionHash.TransactionHashSchema)(original)
      const encoded = Schema.encodeSync(TransactionHash.TransactionHashSchema)(decoded)
      const redecoded = Schema.decodeSync(TransactionHash.TransactionHashSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('preserves data with various transaction hashes', () => {
      const txHashes = [
        '0x' + '00'.repeat(32),
        '0x' + 'ff'.repeat(32),
        '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
      ]
      for (const hash of txHashes) {
        const decoded = Schema.decodeSync(TransactionHash.TransactionHashSchema)(hash)
        const encoded = Schema.encodeSync(TransactionHash.TransactionHashSchema)(decoded)
        const redecoded = Schema.decodeSync(TransactionHash.TransactionHashSchema)(encoded)
        expect(decoded).toEqual(redecoded)
      }
    })
  })

  describe('BlockNumberSchema', () => {
    it('decode(encode(decode(x))) === decode(x) for number', () => {
      const original = 12345
      const decoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(original)
      const encoded = Schema.encodeSync(BlockNumber.BlockNumberSchema)(decoded)
      const redecoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('decode(encode(decode(x))) === decode(x) for bigint', () => {
      const original = 12345n
      const decoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(original)
      const encoded = Schema.encodeSync(BlockNumber.BlockNumberSchema)(decoded)
      const redecoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('preserves data with various block numbers', () => {
      const blockNumbers: (number | bigint)[] = [0, 1, 12345, 0n, 1n, 12345678n, 2n ** 64n - 1n]
      for (const num of blockNumbers) {
        const decoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(num)
        const encoded = Schema.encodeSync(BlockNumber.BlockNumberSchema)(decoded)
        const redecoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(encoded)
        expect(decoded).toEqual(redecoded)
      }
    })
  })

  describe('ChainIdSchema', () => {
    it('decode(encode(decode(x))) === decode(x)', () => {
      const original = 1
      const decoded = Schema.decodeSync(ChainId.ChainIdSchema)(original)
      const encoded = Schema.encodeSync(ChainId.ChainIdSchema)(decoded)
      const redecoded = Schema.decodeSync(ChainId.ChainIdSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('preserves data with various chain IDs', () => {
      const chainIds = [1, 11155111, 137, 42161, 10, 17000]
      for (const id of chainIds) {
        const decoded = Schema.decodeSync(ChainId.ChainIdSchema)(id)
        const encoded = Schema.encodeSync(ChainId.ChainIdSchema)(decoded)
        const redecoded = Schema.decodeSync(ChainId.ChainIdSchema)(encoded)
        expect(decoded).toEqual(redecoded)
      }
    })
  })
})

describe('Canonicalization', () => {
  describe('AddressSchema', () => {
    it('encoding lowercases mixed-case input', () => {
      const mixed = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
      const decoded = Schema.decodeSync(Address.AddressSchema)(mixed)
      const encoded = Schema.encodeSync(Address.AddressSchema)(decoded)
      expect(encoded).toBe(encoded.toLowerCase())
    })

    it('normalizes uppercase input to lowercase', () => {
      const upper = '0x742D35CC6634C0532925A3B844BC9E7595F251E3'
      const lower = '0x742d35cc6634c0532925a3b844bc9e7595f251e3'
      const decodedUpper = Schema.decodeSync(Address.AddressSchema)(upper)
      const decodedLower = Schema.decodeSync(Address.AddressSchema)(lower)
      expect(decodedUpper).toEqual(decodedLower)
    })
  })

  describe('HexSchema', () => {
    it('preserves original casing in encode', () => {
      const original = '0xDeAdBeEf'
      const decoded = Schema.decodeSync(Hex.Schema)(original)
      const encoded = Schema.encodeSync(Hex.Schema)(decoded)
      expect(encoded).toBe(decoded)
    })
  })

  describe('HashSchema', () => {
    it('encoding lowercases mixed-case input', () => {
      const mixed = '0xABcdEF' + '12'.repeat(29)
      const decoded = Schema.decodeSync(Hash.HashSchema)(mixed)
      const encoded = Schema.encodeSync(Hash.HashSchema)(decoded)
      expect(encoded).toBe(encoded.toLowerCase())
    })
  })

  describe('BlockHashSchema', () => {
    it('encoding lowercases mixed-case input', () => {
      const mixed = '0xD4E56740F876AEF8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'
      const decoded = Schema.decodeSync(BlockHash.BlockHashSchema)(mixed)
      const encoded = Schema.encodeSync(BlockHash.BlockHashSchema)(decoded)
      expect(encoded).toBe(encoded.toLowerCase())
    })
  })

  describe('TransactionHashSchema', () => {
    it('encoding lowercases mixed-case input', () => {
      const mixed = '0x88DF016429689C079F3B2F6AD39FA052532C56795B733DA78A91EBE6A713944B'
      const decoded = Schema.decodeSync(TransactionHash.TransactionHashSchema)(mixed)
      const encoded = Schema.encodeSync(TransactionHash.TransactionHashSchema)(decoded)
      expect(encoded).toBe(encoded.toLowerCase())
    })
  })
})

describe('Edge cases', () => {
  describe('AddressSchema', () => {
    it('handles zero address', () => {
      const zero = '0x0000000000000000000000000000000000000000'
      const decoded = Schema.decodeSync(Address.AddressSchema)(zero)
      const encoded = Schema.encodeSync(Address.AddressSchema)(decoded)
      const redecoded = Schema.decodeSync(Address.AddressSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('handles max address', () => {
      const max = '0xffffffffffffffffffffffffffffffffffffffff'
      const decoded = Schema.decodeSync(Address.AddressSchema)(max)
      const encoded = Schema.encodeSync(Address.AddressSchema)(decoded)
      const redecoded = Schema.decodeSync(Address.AddressSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })
  })

  describe('HashSchema', () => {
    it('handles zero hash', () => {
      const zero = '0x' + '00'.repeat(32)
      const decoded = Schema.decodeSync(Hash.HashSchema)(zero)
      const encoded = Schema.encodeSync(Hash.HashSchema)(decoded)
      const redecoded = Schema.decodeSync(Hash.HashSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('handles max hash', () => {
      const max = '0x' + 'ff'.repeat(32)
      const decoded = Schema.decodeSync(Hash.HashSchema)(max)
      const encoded = Schema.encodeSync(Hash.HashSchema)(decoded)
      const redecoded = Schema.decodeSync(Hash.HashSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })
  })

  describe('BlockNumberSchema', () => {
    it('handles zero block number', () => {
      const decoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(0)
      const encoded = Schema.encodeSync(BlockNumber.BlockNumberSchema)(decoded)
      const redecoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })

    it('handles large block number', () => {
      const large = 2n ** 64n - 1n
      const decoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(large)
      const encoded = Schema.encodeSync(BlockNumber.BlockNumberSchema)(decoded)
      const redecoded = Schema.decodeSync(BlockNumber.BlockNumberSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })
  })

  describe('ChainIdSchema', () => {
    it('rejects zero chain ID', () => {
      expect(() => Schema.decodeSync(ChainId.ChainIdSchema)(0)).toThrow()
    })

    it('rejects negative chain ID', () => {
      expect(() => Schema.decodeSync(ChainId.ChainIdSchema)(-1)).toThrow()
    })

    it('handles very large chain ID', () => {
      const large = 999999999
      const decoded = Schema.decodeSync(ChainId.ChainIdSchema)(large)
      const encoded = Schema.encodeSync(ChainId.ChainIdSchema)(decoded)
      const redecoded = Schema.decodeSync(ChainId.ChainIdSchema)(encoded)
      expect(decoded).toEqual(redecoded)
    })
  })
})
