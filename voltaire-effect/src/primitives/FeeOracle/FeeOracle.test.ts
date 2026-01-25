import { describe, it, expect } from 'vitest'
import * as FeeOracle from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('FeeOracleSchema', () => {
  it('decodes valid fee oracle result', () => {
    const input = {
      baseFee: 1000000000n,
      priorityFee: 1500000000n,
      maxFee: 3000000000n,
    }
    const result = Schema.decodeSync(FeeOracle.FeeOracleSchema)(input)
    expect(result.baseFee).toBe(1000000000n)
    expect(result.priorityFee).toBe(1500000000n)
    expect(result.maxFee).toBe(3000000000n)
  })

  it('decodes with number inputs', () => {
    const input = {
      baseFee: 1000000000,
      priorityFee: 1500000000,
      maxFee: 3000000000,
    }
    const result = Schema.decodeSync(FeeOracle.FeeOracleSchema)(input)
    expect(result.baseFee).toBe(1000000000n)
  })

  it('decodes with string inputs', () => {
    const input = {
      baseFee: '1000000000',
      priorityFee: '1500000000',
      maxFee: '3000000000',
    }
    const result = Schema.decodeSync(FeeOracle.FeeOracleSchema)(input)
    expect(result.baseFee).toBe(1000000000n)
  })

  it('handles optional gasPrice', () => {
    const input = {
      baseFee: 1000000000n,
      priorityFee: 1500000000n,
      maxFee: 3000000000n,
      gasPrice: 2000000000n,
    }
    const result = Schema.decodeSync(FeeOracle.FeeOracleSchema)(input)
    expect(result.gasPrice).toBe(2000000000n)
  })

  it('handles optional estimatedTime', () => {
    const input = {
      baseFee: 1000000000n,
      priorityFee: 1500000000n,
      maxFee: 3000000000n,
      estimatedTime: 12,
    }
    const result = Schema.decodeSync(FeeOracle.FeeOracleSchema)(input)
    expect(result.estimatedTime).toBe(12)
  })

  it('encodes back to input format', () => {
    const input = {
      baseFee: 1000000000n,
      priorityFee: 1500000000n,
      maxFee: 3000000000n,
    }
    const decoded = Schema.decodeSync(FeeOracle.FeeOracleSchema)(input)
    const encoded = Schema.encodeSync(FeeOracle.FeeOracleSchema)(decoded)
    expect(encoded.baseFee).toBe(1000000000n)
  })
})

describe('FeeOracle.from', () => {
  it('creates fee oracle from input', async () => {
    const input = {
      baseFee: 1000000000n,
      priorityFee: 1500000000n,
      maxFee: 3000000000n,
    }
    const result = await Effect.runPromise(FeeOracle.from(input))
    expect(result.baseFee).toBe(1000000000n)
  })

  it('handles mixed input types', async () => {
    const input = {
      baseFee: 1000000000,
      priorityFee: '1500000000',
      maxFee: 3000000000n,
    }
    const result = await Effect.runPromise(FeeOracle.from(input))
    expect(result.baseFee).toBe(1000000000n)
    expect(result.priorityFee).toBe(1500000000n)
  })
})

describe('FeeOracle.validate', () => {
  it('succeeds for valid fee oracle', async () => {
    const fee = {
      baseFee: 1000000000n,
      priorityFee: 1500000000n,
      maxFee: 3000000000n,
    }
    await expect(Effect.runPromise(FeeOracle.validate(fee))).resolves.toBeUndefined()
  })

  it('fails for negative baseFee', async () => {
    const fee = {
      baseFee: -1n,
      priorityFee: 1500000000n,
      maxFee: 3000000000n,
    }
    const result = await Effect.runPromiseExit(FeeOracle.validate(fee))
    expect(result._tag).toBe('Failure')
  })

  it('fails when maxFee < baseFee + priorityFee', async () => {
    const fee = {
      baseFee: 2000000000n,
      priorityFee: 2000000000n,
      maxFee: 1000000000n,
    }
    const result = await Effect.runPromiseExit(FeeOracle.validate(fee))
    expect(result._tag).toBe('Failure')
  })
})

describe('FeeOracle.effectiveGasPrice', () => {
  it('returns baseFee + priorityFee when below maxFee', async () => {
    const fee = {
      baseFee: 1000000000n,
      priorityFee: 500000000n,
      maxFee: 3000000000n,
    }
    const result = await Effect.runPromise(FeeOracle.effectiveGasPrice(fee))
    expect(result).toBe(1500000000n)
  })

  it('returns maxFee when effective would exceed it', async () => {
    const fee = {
      baseFee: 2000000000n,
      priorityFee: 2000000000n,
      maxFee: 3000000000n,
    }
    const result = await Effect.runPromise(FeeOracle.effectiveGasPrice(fee))
    expect(result).toBe(3000000000n)
  })
})

describe('FeeOracle.withMultiplier', () => {
  it('applies multiplier to maxFee and priorityFee', async () => {
    const fee = {
      baseFee: 1000000000n,
      priorityFee: 1000000000n,
      maxFee: 2000000000n,
    }
    const result = await Effect.runPromise(FeeOracle.withMultiplier(fee, 1.5))
    expect(result.priorityFee).toBe(1500000000n)
    expect(result.maxFee).toBe(3000000000n)
    expect(result.baseFee).toBe(1000000000n)
  })
})
