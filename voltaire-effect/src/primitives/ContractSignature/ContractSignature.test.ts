import { describe, it, expect } from 'vitest'
import * as ContractSignature from './index.js'
import * as Effect from 'effect/Effect'

describe('ContractSignature.ERC1271_MAGIC_VALUE', () => {
  it('exports magic value', () => {
    expect(ContractSignature.ERC1271_MAGIC_VALUE).toBeDefined()
  })
})

describe('ContractSignature.isValidSignature', () => {
  it('validates signature with magic return value', async () => {
    const hash = new Uint8Array(32).fill(0x12)
    const signature = new Uint8Array(65).fill(0x34)
    const expectedSigner = new Uint8Array(20).fill(0x56)
    const magicValue = new Uint8Array([0x16, 0x26, 0xba, 0x7e])
    
    const result = await Effect.runPromise(
      ContractSignature.isValidSignature(hash, signature, expectedSigner, magicValue)
    )
    expect(typeof result).toBe('boolean')
  })

  it('returns false for invalid return data', async () => {
    const hash = new Uint8Array(32).fill(0x12)
    const signature = new Uint8Array(65).fill(0x34)
    const expectedSigner = new Uint8Array(20).fill(0x56)
    const invalidReturn = new Uint8Array([0x00, 0x00, 0x00, 0x00])
    
    const result = await Effect.runPromise(
      ContractSignature.isValidSignature(hash, signature, expectedSigner, invalidReturn)
    )
    expect(result).toBe(false)
  })
})
