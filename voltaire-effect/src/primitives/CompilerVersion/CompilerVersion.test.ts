import { describe, it, expect } from 'vitest'
import * as CompilerVersion from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('CompilerVersionSchema', () => {
  it('decodes valid version string', () => {
    const result = Schema.decodeSync(CompilerVersion.CompilerVersionSchema)('v0.8.20')
    expect(result).toBe('v0.8.20')
  })

  it('decodes version with commit hash', () => {
    const result = Schema.decodeSync(CompilerVersion.CompilerVersionSchema)('v0.8.20+commit.a1b2c3d4')
    expect(result).toBe('v0.8.20+commit.a1b2c3d4')
  })

  it('encodes back to string', () => {
    const decoded = Schema.decodeSync(CompilerVersion.CompilerVersionSchema)('v0.8.20')
    const encoded = Schema.encodeSync(CompilerVersion.CompilerVersionSchema)(decoded)
    expect(encoded).toBe('v0.8.20')
  })
})

describe('CompilerVersion.from', () => {
  it('creates version from string', async () => {
    const result = await Effect.runPromise(CompilerVersion.from('v0.8.20'))
    expect(result).toBe('v0.8.20')
  })
})

describe('CompilerVersion.parse', () => {
  it('parses version components', async () => {
    const result = await Effect.runPromise(CompilerVersion.parse('v0.8.20'))
    expect(result.major).toBe(0)
    expect(result.minor).toBe(8)
    expect(result.patch).toBe(20)
  })
})

describe('CompilerVersion.compare', () => {
  it('compares versions correctly', async () => {
    const result = await Effect.runPromise(CompilerVersion.compare('v0.8.20', 'v0.8.19'))
    expect(result).toBeGreaterThan(0)
  })

  it('returns 0 for equal versions', async () => {
    const result = await Effect.runPromise(CompilerVersion.compare('v0.8.20', 'v0.8.20'))
    expect(result).toBe(0)
  })

  it('returns negative for lower version', async () => {
    const result = await Effect.runPromise(CompilerVersion.compare('v0.8.18', 'v0.8.20'))
    expect(result).toBeLessThan(0)
  })
})

describe('CompilerVersion.getMajor/Minor/Patch', () => {
  it('gets major version', async () => {
    const result = await Effect.runPromise(CompilerVersion.getMajor('v0.8.20'))
    expect(result).toBe(0)
  })

  it('gets minor version', async () => {
    const result = await Effect.runPromise(CompilerVersion.getMinor('v0.8.20'))
    expect(result).toBe(8)
  })

  it('gets patch version', async () => {
    const result = await Effect.runPromise(CompilerVersion.getPatch('v0.8.20'))
    expect(result).toBe(20)
  })
})

describe('CompilerVersion.isCompatible', () => {
  it('checks version compatibility', async () => {
    const result = await Effect.runPromise(CompilerVersion.isCompatible('v0.8.20', '^0.8.0'))
    expect(result).toBe(true)
  })

  it('returns false for incompatible versions', async () => {
    const result = await Effect.runPromise(CompilerVersion.isCompatible('v0.7.6', '^0.8.0'))
    expect(result).toBe(false)
  })
})
