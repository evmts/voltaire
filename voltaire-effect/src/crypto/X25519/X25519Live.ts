import * as Layer from 'effect/Layer'
import { X25519Service } from './X25519Service.js'
import { generateKeyPair } from './generateKeyPair.js'
import { getPublicKey } from './getPublicKey.js'
import { computeSecret } from './computeSecret.js'

/**
 * Production layer for X25519Service using native X25519 implementation.
 * @since 0.0.1
 */
export const X25519Live = Layer.succeed(
  X25519Service,
  {
    generateKeyPair,
    getPublicKey,
    computeSecret
  }
)
