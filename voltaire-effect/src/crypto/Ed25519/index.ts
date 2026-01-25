/**
 * Ed25519 cryptographic signature module for Effect.
 * Provides fast elliptic curve digital signatures.
 * @module
 * @since 0.0.1
 */
export { sign } from './sign.js'
export { verify } from './verify.js'
export { getPublicKey } from './getPublicKey.js'
export { Ed25519Service, type Ed25519ServiceShape } from './Ed25519Service.js'
export { Ed25519Live } from './Ed25519Live.js'
export { Ed25519Test } from './Ed25519Test.js'
