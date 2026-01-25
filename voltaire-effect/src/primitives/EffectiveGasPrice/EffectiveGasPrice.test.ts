import { describe, it, expect } from 'vitest'
import * as EffectiveGasPrice from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('EffectiveGasPriceSchema', () => {
  it('decodes bigint', () => {
    const result = Schema.decodeSync(EffectiveGasPrice.EffectiveGasPriceSchema)(1000000000n)
    expect(result).toBe(1000000000n)
  })

  it('decodes number', () => {
    const result = Schema.decodeSync(EffectiveGasPrice.EffectiveGasPriceSchema)(1000000000)
    expect(result).toBe(1000000000n)
  })

  it('decodes string', () => {
    const result = Schema.decodeSync(EffectiveGasPrice.EffectiveGasPriceSchema)('1000000000')
    expect(result).toBe(1000000000n)
  })

  it('encodes back to bigint', () => {
    const decoded = Schema.decodeSync(EffectiveGasPrice.EffectiveGasPriceSchema)(1000000000n)
    const encoded = Schema.encodeSync(EffectiveGasPrice.EffectiveGasPriceSchema)(decoded)
    expect(encoded).toBe(1000000000n)
  })
})

describe('EffectiveGasPrice.from', () => {
  it('creates from bigint', async () => {
    const result = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    expect(result).toBe(50000000000n)
  })

  it('creates from number', async () => {
    const result = await Effect.runPromise(EffectiveGasPrice.from(50000000000))
    expect(result).toBe(50000000000n)
  })
})

describe('EffectiveGasPrice.fromGwei', () => {
  it('converts from gwei', async () => {
    const result = await Effect.runPromise(EffectiveGasPrice.fromGwei(50))
    expect(result).toBe(50000000000n)
  })
})

describe('EffectiveGasPrice.fromWei', () => {
  it('converts from wei', async () => {
    const result = await Effect.runPromise(EffectiveGasPrice.fromWei(50000000000n))
    expect(result).toBe(50000000000n)
  })
})

describe('EffectiveGasPrice.calculate', () => {
  it('calculates effective gas price', async () => {
    const baseFee = 30000000000n
    const priorityFee = 2000000000n
    const maxFee = 100000000000n
    const result = await Effect.runPromise(EffectiveGasPrice.calculate(baseFee, priorityFee, maxFee))
    expect(result).toBe(32000000000n)
  })

  it('caps at maxFeePerGas', async () => {
    const baseFee = 90000000000n
    const priorityFee = 20000000000n
    const maxFee = 100000000000n
    const result = await Effect.runPromise(EffectiveGasPrice.calculate(baseFee, priorityFee, maxFee))
    expect(result).toBe(100000000000n)
  })
})

describe('EffectiveGasPrice.toGwei', () => {
  it('converts to gwei', async () => {
    const price = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    const gwei = await Effect.runPromise(EffectiveGasPrice.toGwei(price))
    expect(gwei).toBe(50n)
  })
})

describe('EffectiveGasPrice.equals', () => {
  it('returns true for equal prices', async () => {
    const a = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    const b = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    const result = await Effect.runPromise(EffectiveGasPrice.equals(a, b))
    expect(result).toBe(true)
  })

  it('returns false for different prices', async () => {
    const a = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    const b = await Effect.runPromise(EffectiveGasPrice.from(60000000000n))
    const result = await Effect.runPromise(EffectiveGasPrice.equals(a, b))
    expect(result).toBe(false)
  })
})

describe('EffectiveGasPrice.compare', () => {
  it('returns 0 for equal prices', async () => {
    const a = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    const b = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    const result = await Effect.runPromise(EffectiveGasPrice.compare(a, b))
    expect(result).toBe(0)
  })

  it('returns positive for a > b', async () => {
    const a = await Effect.runPromise(EffectiveGasPrice.from(60000000000n))
    const b = await Effect.runPromise(EffectiveGasPrice.from(50000000000n))
    const result = await Effect.runPromise(EffectiveGasPrice.compare(a, b))
    expect(result).toBeGreaterThan(0)
  })
})
