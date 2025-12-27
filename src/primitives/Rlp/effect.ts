import * as Schema from 'effect/Schema'
import * as Brand from 'effect/Brand'

import type { BrandedRlp } from './RlpType.js'
import * as RlpImpl from './internal-index.js'

export type RlpBrand = BrandedRlp & Brand.Brand<'Rlp'>

export const RlpBrand = Brand.refined<RlpBrand>(
  (v): v is RlpBrand => RlpImpl.validate(v as any) === true,
  () => Brand.error('Invalid RLP value')
)

export class RlpSchema extends Schema.Class<RlpSchema>('Rlp')({
  value: Schema.Unknown
}) {
  get rlp(): BrandedRlp { return this.value as BrandedRlp }
  get branded(): RlpBrand { return this.value as RlpBrand }

  static fromBranded(brand: RlpBrand): RlpSchema { return new RlpSchema({ value: brand as any }) }

  static from(value: Uint8Array | BrandedRlp | BrandedRlp[]): RlpSchema {
    const r = RlpImpl.from(value as any)
    return new RlpSchema({ value: r })
  }

  encode(): Uint8Array {
    const v:any = this.rlp as any
    if (RlpImpl.isData(v)) return RlpImpl.encode(v)
    if (v instanceof Uint8Array) return RlpImpl.encodeBytes(v)
    if (Array.isArray(v)) return RlpImpl.encodeList(v as any)
    return RlpImpl.encode(v as any)
  }
  static decode(bytes: Uint8Array): RlpSchema { const d = RlpImpl.decode(bytes) as any; return new RlpSchema({ value: d.data }) }
  equals(other: RlpSchema | BrandedRlp): boolean {
    const rhs = other instanceof RlpSchema ? other.rlp : other
    return RlpImpl.equals(this.rlp, rhs)
  }
  toJSON(): unknown { return RlpImpl.toJSON(this.rlp) }
  toRaw(): unknown { return RlpImpl.toRaw(this.rlp) }
}
