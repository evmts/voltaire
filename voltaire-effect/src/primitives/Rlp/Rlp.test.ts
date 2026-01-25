import { describe, it, expect } from 'vitest'
import * as Rlp from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('Rlp Schema', () => {
  it('decodes Uint8Array to RLP data', () => {
    const input = new Uint8Array([0x01, 0x02, 0x03])
    const result = Schema.decodeSync(Rlp.Schema)(input)
    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('value')
  })

  it('rejects invalid input', () => {
    expect(() => Schema.decodeSync(Rlp.Schema)(null)).toThrow()
  })
})

describe('Rlp.encode', () => {
  it('encodes bytes', async () => {
    const input = new Uint8Array([0x01, 0x02, 0x03])
    const result = await Effect.runPromise(Rlp.encode(input))
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('encodes empty bytes', async () => {
    const result = await Effect.runPromise(Rlp.encode(new Uint8Array(0)))
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('encodes single byte < 0x80', async () => {
    const result = await Effect.runPromise(Rlp.encode(new Uint8Array([0x42])))
    expect(result).toEqual(new Uint8Array([0x42]))
  })

  it('encodes array/list', async () => {
    const result = await Effect.runPromise(Rlp.encode([
      new Uint8Array([0x01]),
      new Uint8Array([0x02])
    ]))
    expect(result).toBeInstanceOf(Uint8Array)
  })
})

describe('Rlp.decode', () => {
  it('decodes single byte', async () => {
    const encoded = new Uint8Array([0x42])
    const result = await Effect.runPromise(Rlp.decode(encoded))
    expect(result.data).toHaveProperty('type', 'bytes')
    expect(result.remainder).toEqual(new Uint8Array(0))
  })

  it('decodes bytes', async () => {
    const encoded = new Uint8Array([0x83, 0x01, 0x02, 0x03])
    const result = await Effect.runPromise(Rlp.decode(encoded))
    expect(result.data).toHaveProperty('type', 'bytes')
    expect(result.remainder.length).toBe(0)
  })

  it('decodes list', async () => {
    const encoded = new Uint8Array([0xc3, 0x01, 0x02, 0x03])
    const result = await Effect.runPromise(Rlp.decode(encoded))
    expect(result.data).toHaveProperty('type', 'list')
  })

  it('stream mode returns remainder', async () => {
    const encoded = new Uint8Array([0x01, 0x02])
    const result = await Effect.runPromise(Rlp.decode(encoded, true))
    expect(result.data).toHaveProperty('type', 'bytes')
    expect(result.remainder.length).toBe(1)
  })

  it('fails on empty input', async () => {
    const result = await Effect.runPromiseExit(Rlp.decode(new Uint8Array(0)))
    expect(result._tag).toBe('Failure')
  })
})

describe('roundtrip', () => {
  it('encode then decode bytes', async () => {
    const original = new Uint8Array([0x01, 0x02, 0x03])
    const encoded = await Effect.runPromise(Rlp.encode(original))
    const decoded = await Effect.runPromise(Rlp.decode(encoded))
    expect(decoded.data.type).toBe('bytes')
    if (decoded.data.type === 'bytes') {
      expect(decoded.data.value).toEqual(original)
    }
  })

  it('encode then decode list', async () => {
    const original = [new Uint8Array([0x01]), new Uint8Array([0x02])]
    const encoded = await Effect.runPromise(Rlp.encode(original))
    const decoded = await Effect.runPromise(Rlp.decode(encoded))
    expect(decoded.data.type).toBe('list')
  })
})
