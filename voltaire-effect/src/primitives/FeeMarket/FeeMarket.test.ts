import { describe, it, expect } from 'vitest'
import * as FeeMarket from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('FeeMarketSchema', () => {
  it('decodes valid fee market state', () => {
    const input = {
      gasUsed: 15000000n,
      gasLimit: 30000000n,
      baseFee: 1000000000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    }
    const result = Schema.decodeSync(FeeMarket.FeeMarketSchema)(input)
    expect(result.gasUsed).toBe(15000000n)
    expect(result.baseFee).toBe(1000000000n)
  })

  it('decodes with number inputs', () => {
    const input = {
      gasUsed: 15000000,
      gasLimit: 30000000,
      baseFee: 1000000000,
      excessBlobGas: 0,
      blobGasUsed: 0,
    }
    const result = Schema.decodeSync(FeeMarket.FeeMarketSchema)(input)
    expect(result.gasUsed).toBe(15000000n)
  })

  it('encodes back to input format', () => {
    const input = {
      gasUsed: 15000000n,
      gasLimit: 30000000n,
      baseFee: 1000000000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    }
    const decoded = Schema.decodeSync(FeeMarket.FeeMarketSchema)(input)
    const encoded = Schema.encodeSync(FeeMarket.FeeMarketSchema)(decoded)
    expect(encoded.gasUsed).toBe(15000000n)
  })
})

describe('FeeMarket.from', () => {
  it('creates fee market state', async () => {
    const input = {
      gasUsed: 15000000n,
      gasLimit: 30000000n,
      baseFee: 1000000000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    }
    const result = await Effect.runPromise(FeeMarket.from(input))
    expect(result.gasUsed).toBe(15000000n)
  })
})

describe('FeeMarket.BaseFee', () => {
  it('calculates next base fee', async () => {
    const parentGasUsed = 15000000n
    const parentGasLimit = 30000000n
    const parentBaseFee = 1000000000n
    const result = await Effect.runPromise(FeeMarket.BaseFee(parentGasUsed, parentGasLimit, parentBaseFee))
    expect(result).toBe(1000000000n)
  })

  it('increases base fee when above target', async () => {
    const parentGasUsed = 20000000n
    const parentGasLimit = 30000000n
    const parentBaseFee = 1000000000n
    const result = await Effect.runPromise(FeeMarket.BaseFee(parentGasUsed, parentGasLimit, parentBaseFee))
    expect(result).toBeGreaterThan(1000000000n)
  })

  it('decreases base fee when below target', async () => {
    const parentGasUsed = 10000000n
    const parentGasLimit = 30000000n
    const parentBaseFee = 1000000000n
    const result = await Effect.runPromise(FeeMarket.BaseFee(parentGasUsed, parentGasLimit, parentBaseFee))
    expect(result).toBeLessThan(1000000000n)
  })
})

describe('FeeMarket.BlobBaseFee', () => {
  it('calculates blob base fee', async () => {
    const result = await Effect.runPromise(FeeMarket.BlobBaseFee(0n))
    expect(result).toBe(1n)
  })

  it('increases with excess blob gas', async () => {
    // Need a much larger excess to see meaningful increase due to large UPDATE_FRACTION (3338477n)
    // e^(10_000_000/3338477) ≈ e^3 ≈ 20
    const result = await Effect.runPromise(FeeMarket.BlobBaseFee(10_000_000n))
    expect(result).toBeGreaterThan(1n)
  })
})

describe('FeeMarket.calculateExcessBlobGas', () => {
  it('calculates excess blob gas', async () => {
    const result = await Effect.runPromise(FeeMarket.calculateExcessBlobGas(0n, 393216n))
    expect(typeof result).toBe('bigint')
  })
})

describe('FeeMarket.calculateTxFee', () => {
  it('calculates transaction fee', async () => {
    const gasUsed = 21000n
    const effectiveGasPrice = 50000000000n
    const result = await Effect.runPromise(FeeMarket.calculateTxFee(gasUsed, effectiveGasPrice))
    expect(result).toBe(1050000000000000n)
  })
})

describe('FeeMarket.canIncludeTx', () => {
  it('returns true when maxFee >= baseFee', async () => {
    const result = await Effect.runPromise(FeeMarket.canIncludeTx(100n, 50n))
    expect(result).toBe(true)
  })

  it('returns false when maxFee < baseFee', async () => {
    const result = await Effect.runPromise(FeeMarket.canIncludeTx(50n, 100n))
    expect(result).toBe(false)
  })
})

describe('FeeMarket.weiToGwei', () => {
  it('converts wei to gwei', async () => {
    const result = await Effect.runPromise(FeeMarket.weiToGwei(1000000000n))
    expect(result).toBe(1n)
  })
})

describe('FeeMarket.gweiToWei', () => {
  it('converts gwei to wei', async () => {
    const result = await Effect.runPromise(FeeMarket.gweiToWei(1n))
    expect(result).toBe(1000000000n)
  })
})

describe('FeeMarket constants', () => {
  it('exports Eip1559 constants', () => {
    expect(FeeMarket.Eip1559).toBeDefined()
  })

  it('exports Eip4844 constants', () => {
    expect(FeeMarket.Eip4844).toBeDefined()
  })
})
