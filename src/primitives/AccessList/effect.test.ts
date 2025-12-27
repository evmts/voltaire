import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import { AccessListSchema, AccessListBrand } from './effect.js'

describe('AccessList Effect Schema', () => {
  const addr = new Uint8Array(20)
  const slot = new Uint8Array(32)

  it('constructs and queries', () => {
    const a = AccessListSchema.create()
      .withAddress(addr)
      .withStorageKey(addr, slot)
    expect(a.includesAddress(addr)).toBe(true)
    expect(a.includesStorageKey(addr, slot)).toBe(true)
    const keys = a.keysFor(addr)
    expect(keys && keys[0]).toBeInstanceOf(Uint8Array)
  })

  it('encodes/decodes bytes', () => {
    const a = AccessListSchema.from([{ address: addr, storageKeys: [slot] }])
    const bytes = a.toBytes()
    const b = AccessListSchema.fromBytes(bytes)
    expect(b.includesAddress(addr)).toBe(true)
  })

  it('brand interop', () => {
    const a = AccessListSchema.from([{ address: addr, storageKeys: [slot] }])
    const brand = AccessListBrand(a.accessList as any)
    const b = AccessListSchema.fromBranded(brand)
    expect(Array.isArray(b.branded)).toBe(true)
    expect(b.includesAddress(addr)).toBe(true)
  })
})
