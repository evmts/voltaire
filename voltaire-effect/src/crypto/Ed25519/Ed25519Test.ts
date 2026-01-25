import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { Ed25519Service } from './Ed25519Service.js'

/**
 * Test layer for Ed25519Service returning deterministic mock values.
 * Use for unit testing without cryptographic overhead.
 * @since 0.0.1
 */
export const Ed25519Test = Layer.succeed(
  Ed25519Service,
  {
    sign: (_message: Uint8Array, _secretKey: Uint8Array) => Effect.succeed(new Uint8Array(64)),
    verify: (_signature: Uint8Array, _message: Uint8Array, _publicKey: Uint8Array) => Effect.succeed(true),
    getPublicKey: (_secretKey: Uint8Array) => Effect.succeed(new Uint8Array(32))
  }
)
