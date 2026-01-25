import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { X25519Service } from './X25519Service.js'

/**
 * Test layer for X25519Service returning deterministic mock values.
 * Use for unit testing without cryptographic overhead.
 * @since 0.0.1
 */
export const X25519Test = Layer.succeed(
  X25519Service,
  {
    generateKeyPair: () => Effect.succeed({
      secretKey: new Uint8Array(32),
      publicKey: new Uint8Array(32)
    }),
    getPublicKey: (_secretKey: Uint8Array) => Effect.succeed(new Uint8Array(32)),
    computeSecret: (_secretKey: Uint8Array, _publicKey: Uint8Array) => Effect.succeed(new Uint8Array(32))
  }
)
