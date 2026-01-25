import { describe, it, expect } from 'vitest'
import * as DecodedData from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('DecodedDataSchema', () => {
  it('decodes valid decoded data object', () => {
    const input = {
      values: [100n, '0x1234'],
      types: ['uint256', 'bytes'],
    }
    const result = Schema.decodeSync(DecodedData.DecodedDataSchema)(input)
    expect(result.values).toEqual([100n, '0x1234'])
    expect(result.types).toEqual(['uint256', 'bytes'])
  })

  it('encodes back to input format', () => {
    const input = {
      values: [100n],
      types: ['uint256'],
    }
    const decoded = Schema.decodeSync(DecodedData.DecodedDataSchema)(input)
    const encoded = Schema.encodeSync(DecodedData.DecodedDataSchema)(decoded)
    expect(encoded.types).toEqual(['uint256'])
  })
})

describe('DecodedData.from', () => {
  it('creates decoded data from values and types', async () => {
    const values = [100n, '0x1234']
    const types = ['uint256', 'bytes']
    const result = await Effect.runPromise(DecodedData.from(values, types))
    expect(result.values).toEqual(values)
    expect(result.types).toEqual(types)
  })

  it('creates decoded data with single value', async () => {
    const result = await Effect.runPromise(DecodedData.from(42n, ['uint256']))
    expect(result.values).toBe(42n)
    expect(result.types).toEqual(['uint256'])
  })
})
