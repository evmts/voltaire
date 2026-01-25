/**
 * @fileoverview Ed25519 cryptographic signature module for Effect.
 *
 * @description
 * Provides high-performance Ed25519 elliptic curve digital signatures.
 * Ed25519 is a modern signature scheme offering fast signing, fast verification,
 * and strong security with compact 32-byte keys and 64-byte signatures.
 *
 * Key features:
 * - Fast and secure elliptic curve signatures
 * - 32-byte keys, 64-byte signatures
 * - Deterministic signing (no random nonce required)
 * - Side-channel attack resistant
 * - Used in Solana, Cardano, Polkadot, SSH, and more
 *
 * @example
 * ```typescript
 * import { sign, verify, getPublicKey, Ed25519Live } from 'voltaire-effect/crypto/Ed25519'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const secretKey = new Uint8Array(32) // Your secret key
 *   const publicKey = yield* getPublicKey(secretKey)
 *   const message = new TextEncoder().encode('Hello!')
 *   const sig = yield* sign(message, secretKey)
 *   const valid = yield* verify(sig, message, publicKey)
 *   return { publicKey, sig, valid }
 * })
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @module Ed25519
 * @since 0.0.1
 */
export { sign } from './sign.js'
export { verify } from './verify.js'
export { getPublicKey } from './getPublicKey.js'
export { Ed25519Service, type Ed25519ServiceShape } from './Ed25519Service.js'
export { Ed25519Live } from './Ed25519Live.js'
export { Ed25519Test } from './Ed25519Test.js'
