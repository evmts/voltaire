import * as Layer from 'effect/Layer'
import { Ed25519Service } from './Ed25519Service.js'
import { sign } from './sign.js'
import { verify } from './verify.js'
import { getPublicKey } from './getPublicKey.js'

/**
 * Production layer for Ed25519Service using native Ed25519 implementation.
 * @since 0.0.1
 */
export const Ed25519Live = Layer.succeed(
  Ed25519Service,
  {
    sign,
    verify,
    getPublicKey
  }
)
