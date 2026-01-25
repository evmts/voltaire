import { describe, it, expect } from 'vitest'
import * as Domain from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import { hash as keccak256 } from '@tevm/voltaire/Keccak256'

describe('DomainSchema', () => {
  it('decodes valid domain object', () => {
    const input = {
      name: 'MyDApp',
      version: '1',
      chainId: 1n,
    }
    const result = Schema.decodeSync(Domain.DomainSchema)(input)
    expect(result.name).toBe('MyDApp')
    expect(result.version).toBe('1')
  })

  it('decodes with verifying contract', () => {
    const input = {
      name: 'MyDApp',
      version: '1',
      chainId: 1n,
      verifyingContract: '0x' + '00'.repeat(20),
    }
    const result = Schema.decodeSync(Domain.DomainSchema)(input)
    expect(result.name).toBe('MyDApp')
  })
})

describe('Domain.from', () => {
  it('creates domain from input', async () => {
    const input = {
      name: 'MyDApp',
      version: '1',
      chainId: 1n,
    }
    const result = await Effect.runPromise(Domain.from(input))
    expect(result.name).toBe('MyDApp')
    expect(result.version).toBe('1')
  })
})

describe('Domain.toHash', () => {
  it('computes domain separator hash', async () => {
    const input = {
      name: 'MyDApp',
      version: '1',
      chainId: 1n,
    }
    const domain = await Effect.runPromise(Domain.from(input))
    const hash = await Effect.runPromise(Domain.toHash(domain, { keccak256 }))
    expect(hash).toBeInstanceOf(Uint8Array)
    expect(hash.length).toBe(32)
  })
})

describe('Domain.getEIP712DomainType', () => {
  it('returns domain type fields', async () => {
    const input = {
      name: 'MyDApp',
      version: '1',
      chainId: 1n,
    }
    const domain = await Effect.runPromise(Domain.from(input))
    const fields = await Effect.runPromise(Domain.getEIP712DomainType(domain))
    expect(Array.isArray(fields)).toBe(true)
    expect(fields.some(f => f.name === 'name')).toBe(true)
  })
})

describe('Domain.getFieldsBitmap', () => {
  it('returns bitmap of present fields', async () => {
    const input = {
      name: 'MyDApp',
      version: '1',
    }
    const domain = await Effect.runPromise(Domain.from(input))
    const bitmap = await Effect.runPromise(Domain.getFieldsBitmap(domain))
    expect(bitmap).toBeInstanceOf(Uint8Array)
  })
})
