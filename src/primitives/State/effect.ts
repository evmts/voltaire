import * as Schema from 'effect/Schema'
import * as Brand from 'effect/Brand'

import type { StorageKeyType } from './StorageKeyType.js'
import { create as _create, from as _from, toString as _toString, equals as _equals, hashCode as _hashCode } from './index.js'

const isAddr20 = (b: unknown): b is Uint8Array => b instanceof Uint8Array && b.length === 20

export type StorageKeyBrand = StorageKeyType & Brand.Brand<'StorageKey'>

export const StorageKeyBrand = Brand.refined<StorageKeyBrand>(
  (_): _ is StorageKeyBrand => true,
  () => Brand.error('Invalid storage key')
)

export class StorageKeySchema extends Schema.Class<StorageKeySchema>('StorageKey')({
  address: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isAddr20, { message: () => 'address must be 20 bytes' })),
  slot: Schema.BigIntFromSelf,
}) {
  get key(): StorageKeyType { return _create(this.address as any, this.slot) }
  get branded(): StorageKeyBrand { return this.key as StorageKeyBrand }
  static fromBranded(brand: StorageKeyBrand): StorageKeySchema { return new StorageKeySchema({ address: (brand as any).address, slot: (brand as any).slot }) as any }
  static from(value: StorageKeyType | { address: Uint8Array; slot: bigint }): StorageKeySchema {
    if (value && (value as any).address && (value as any).slot !== undefined) return new StorageKeySchema(value as any)
    const k = _from(value as any)
    return new StorageKeySchema({ address: (k as any).address, slot: (k as any).slot }) as any
  }
  override toString(): string { return _toString(this.key) }
  equals(other: StorageKeySchema | StorageKeyType): boolean { const rhs = other instanceof StorageKeySchema ? other.key : other; return _equals(this.key, rhs) }
  hashCode(): number { return _hashCode(this.key) }
}
