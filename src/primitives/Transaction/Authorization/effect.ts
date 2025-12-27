import * as Schema from 'effect/Schema'
import * as Brand from 'effect/Brand'

import type { BrandedAuthorization } from './BrandedAuthorization.d.js'
import { getSigningHash as _getSigningHash } from './getSigningHash.js'
import { verifySignature as _verifySignature } from './verifySignature.js'
import { getAuthorizer as _getAuthorizer } from './getAuthorizer.js'

const isAddr20 = (b: unknown): b is Uint8Array => b instanceof Uint8Array && b.length === 20
const isHash32 = (b: unknown): b is Uint8Array => b instanceof Uint8Array && b.length === 32

export type AuthorizationBrand = BrandedAuthorization & Brand.Brand<'Authorization'>

export const AuthorizationBrand = Brand.refined<AuthorizationBrand>(
  (_): _ is AuthorizationBrand => true, // structure validated by schema below
  () => Brand.error('Invalid Authorization')
)

export class AuthorizationSchema extends Schema.Class<AuthorizationSchema>('Authorization')({
  chainId: Schema.BigIntFromSelf,
  address: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isAddr20, { message: () => 'address must be 20 bytes' })),
  nonce: Schema.BigIntFromSelf,
  yParity: Schema.Number.pipe(Schema.filter((n): n is number => n === 0 || n === 1, { message: () => 'yParity must be 0 or 1' })),
  r: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => 'r must be 32 bytes' })),
  s: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => 's must be 32 bytes' })),
}) {
  get authorization(): BrandedAuthorization { return this as unknown as BrandedAuthorization }
  get branded(): AuthorizationBrand { return this.authorization as AuthorizationBrand }

  static fromBranded(brand: AuthorizationBrand): AuthorizationSchema {
    const { chainId, address, nonce, yParity, r, s } = brand as any
    return new AuthorizationSchema({ chainId, address, nonce, yParity, r, s })
  }

  static from(value: { chainId: bigint; address: Uint8Array; nonce: bigint; yParity: number; r: Uint8Array; s: Uint8Array }): AuthorizationSchema {
    return new AuthorizationSchema(value)
  }

  getSigningHash(): Uint8Array { return _getSigningHash(this.authorization) as unknown as Uint8Array }
  verifySignature(): boolean { return _verifySignature(this.authorization) }
  getAuthorizer(): Uint8Array { return _getAuthorizer(this.authorization) as unknown as Uint8Array }
}

