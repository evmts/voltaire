import { describe, it, expect } from 'vitest'
import * as Denomination from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('WeiSchema', () => {
  it('decodes bigint', () => {
    const result = Schema.decodeSync(Denomination.WeiSchema)(1000000000n)
    expect(result).toBe(1000000000n)
  })

  it('decodes number', () => {
    const result = Schema.decodeSync(Denomination.WeiSchema)(1000000000)
    expect(typeof result).toBe('bigint')
  })

  it('decodes string', () => {
    const result = Schema.decodeSync(Denomination.WeiSchema)('1000000000')
    expect(typeof result).toBe('bigint')
  })

  it('decodes hex string', () => {
    const result = Schema.decodeSync(Denomination.WeiSchema)('0x3b9aca00')
    expect(result).toBe(1000000000n)
  })

  it('fails on invalid string', () => {
    expect(() => Schema.decodeSync(Denomination.WeiSchema)('not-a-number')).toThrow()
  })
})

describe('GweiSchema', () => {
  it('decodes bigint', () => {
    const result = Schema.decodeSync(Denomination.GweiSchema)(100n)
    expect(result).toBe(100n)
  })

  it('decodes number', () => {
    const result = Schema.decodeSync(Denomination.GweiSchema)(100)
    expect(result).toBe(100n)
  })

  it('decodes string', () => {
    const result = Schema.decodeSync(Denomination.GweiSchema)('100')
    expect(result).toBe(100n)
  })

  it('decodes hex string', () => {
    const result = Schema.decodeSync(Denomination.GweiSchema)('0x64')
    expect(result).toBe(100n)
  })
})

describe('EtherSchema', () => {
  it('decodes bigint', () => {
    const result = Schema.decodeSync(Denomination.EtherSchema)(1n)
    expect(result).toBe(1n)
  })

  it('decodes number', () => {
    const result = Schema.decodeSync(Denomination.EtherSchema)(5)
    expect(result).toBe(5n)
  })

  it('decodes string', () => {
    const result = Schema.decodeSync(Denomination.EtherSchema)('10')
    expect(result).toBe(10n)
  })
})

describe('fromWei', () => {
  it('creates wei from bigint', async () => {
    const result = await Effect.runPromise(Denomination.fromWei(1000000000n))
    expect(result).toBe(1000000000n)
  })

  it('creates wei from number', async () => {
    const result = await Effect.runPromise(Denomination.fromWei(1000))
    expect(typeof result).toBe('bigint')
  })

  it('creates wei from hex string', async () => {
    const result = await Effect.runPromise(Denomination.fromWei('0x3b9aca00'))
    expect(result).toBe(1000000000n)
  })
})

describe('fromGwei', () => {
  it('creates gwei from bigint', async () => {
    const result = await Effect.runPromise(Denomination.fromGwei(100n))
    expect(result).toBe(100n)
  })

  it('creates gwei from number', async () => {
    const result = await Effect.runPromise(Denomination.fromGwei(100))
    expect(result).toBe(100n)
  })

  it('creates gwei from string', async () => {
    const result = await Effect.runPromise(Denomination.fromGwei('100'))
    expect(result).toBe(100n)
  })
})

describe('fromEther', () => {
  it('creates ether from bigint', async () => {
    const result = await Effect.runPromise(Denomination.fromEther(1n))
    expect(result).toBe(1n)
  })

  it('creates ether from number', async () => {
    const result = await Effect.runPromise(Denomination.fromEther(5))
    expect(result).toBe(5n)
  })
})

describe('weiToGwei', () => {
  it('converts wei to gwei', async () => {
    const wei = await Effect.runPromise(Denomination.fromWei(5000000000n))
    const gwei = await Effect.runPromise(Denomination.weiToGwei(wei))
    expect(gwei).toBe(5n)
  })

  it('handles large amounts', async () => {
    const wei = await Effect.runPromise(Denomination.fromWei(100000000000n))
    const gwei = await Effect.runPromise(Denomination.weiToGwei(wei))
    expect(gwei).toBe(100n)
  })
})

describe('weiToEther', () => {
  it('converts wei to ether', async () => {
    const wei = await Effect.runPromise(Denomination.fromWei(1000000000000000000n))
    const ether = await Effect.runPromise(Denomination.weiToEther(wei))
    expect(ether).toBe(1n)
  })

  it('handles large amounts', async () => {
    const wei = await Effect.runPromise(Denomination.fromWei(5000000000000000000n))
    const ether = await Effect.runPromise(Denomination.weiToEther(wei))
    expect(ether).toBe(5n)
  })
})

describe('gweiToWei', () => {
  it('converts gwei to wei', async () => {
    const gwei = await Effect.runPromise(Denomination.fromGwei(5n))
    const wei = await Effect.runPromise(Denomination.gweiToWei(gwei))
    expect(wei).toBe(5000000000n)
  })

  it('handles large amounts', async () => {
    const gwei = await Effect.runPromise(Denomination.fromGwei(100n))
    const wei = await Effect.runPromise(Denomination.gweiToWei(gwei))
    expect(wei).toBe(100000000000n)
  })
})

describe('etherToWei', () => {
  it('converts ether to wei', async () => {
    const ether = await Effect.runPromise(Denomination.fromEther(1n))
    const wei = await Effect.runPromise(Denomination.etherToWei(ether))
    expect(wei).toBe(1000000000000000000n)
  })

  it('handles multiple ether', async () => {
    const ether = await Effect.runPromise(Denomination.fromEther(5n))
    const wei = await Effect.runPromise(Denomination.etherToWei(ether))
    expect(wei).toBe(5000000000000000000n)
  })
})

describe('gweiToEther', () => {
  it('converts gwei to ether', async () => {
    const gwei = await Effect.runPromise(Denomination.fromGwei(1000000000n))
    const ether = await Effect.runPromise(Denomination.gweiToEther(gwei))
    expect(ether).toBe(1n)
  })
})

describe('etherToGwei', () => {
  it('converts ether to gwei', async () => {
    const ether = await Effect.runPromise(Denomination.fromEther(1n))
    const gwei = await Effect.runPromise(Denomination.etherToGwei(ether))
    expect(gwei).toBe(1000000000n)
  })
})
