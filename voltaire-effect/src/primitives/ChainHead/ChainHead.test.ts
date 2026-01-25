import { describe, it, expect } from 'vitest'
import * as ChainHead from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('ChainHeadSchema', () => {
  it('decodes valid chain head object', () => {
    const input = {
      number: 18000000n,
      hash: '0x' + '00'.repeat(32),
      timestamp: 1699000000n,
    }
    const result = Schema.decodeSync(ChainHead.ChainHeadSchema)(input)
    expect(result.number).toBe(18000000n)
  })

  it('decodes with optional difficulty fields', () => {
    const input = {
      number: 18000000n,
      hash: '0x' + '00'.repeat(32),
      timestamp: 1699000000n,
      difficulty: 0n,
      totalDifficulty: 58750003716598352816469n,
    }
    const result = Schema.decodeSync(ChainHead.ChainHeadSchema)(input)
    expect(result.difficulty).toBe(0n)
    expect(result.totalDifficulty).toBe(58750003716598352816469n)
  })

  it('fails for missing required fields', () => {
    const input = { number: 18000000n }
    expect(() => Schema.decodeSync(ChainHead.ChainHeadSchema)(input as any)).toThrow()
  })
})

describe('ChainHead.from', () => {
  it('creates chain head from object', async () => {
    const input = {
      number: 18000000n,
      hash: '0x' + 'ab'.repeat(32),
      timestamp: 1699000000n,
    }
    const result = await Effect.runPromise(ChainHead.from(input))
    expect(result.number).toBe(18000000n)
  })

  it('fails for invalid input', async () => {
    const result = await Effect.runPromiseExit(ChainHead.from({} as any))
    expect(result._tag).toBe('Failure')
  })
})
