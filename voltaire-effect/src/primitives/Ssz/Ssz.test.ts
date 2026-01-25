import { describe, it, expect } from 'vitest'
import * as Ssz from './index.js'
import * as Schema from 'effect/Schema'

describe('Ssz Schema', () => {
  it('decodes Uint8Array to SSZ type', () => {
    const input = new Uint8Array([0x01, 0x02, 0x03, 0x04])
    const result = Schema.decodeSync(Ssz.Schema)(input)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result).toEqual(input)
  })

  it('encodes SSZ type back to Uint8Array', () => {
    const input = new Uint8Array([0x01, 0x02, 0x03, 0x04])
    const ssz = Schema.decodeSync(Ssz.Schema)(input)
    const encoded = Schema.encodeSync(Ssz.Schema)(ssz)
    expect(encoded).toEqual(input)
  })

  it('handles empty bytes', () => {
    const input = new Uint8Array(0)
    const result = Schema.decodeSync(Ssz.Schema)(input)
    expect(result).toEqual(input)
  })

  it('rejects non-Uint8Array input', () => {
    expect(() => Schema.decodeSync(Ssz.Schema)("not bytes" as unknown as Uint8Array)).toThrow()
  })
})
