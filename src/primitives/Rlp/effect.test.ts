import { describe, it, expect } from 'vitest'
import { RlpSchema } from './effect.js'

describe('Rlp Effect Schema', () => {
  it('encodes and decodes bytes', () => {
    const bytes = new Uint8Array([1,2,3])
    const r = RlpSchema.from(bytes)
    const enc = r.encode()
    expect(enc).toBeInstanceOf(Uint8Array)
    const dec = RlpSchema.decode(enc)
    expect(dec.encode()).toStrictEqual(enc)
  })
})
