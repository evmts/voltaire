/**
 * BLS12-381 cryptographic signature module for Effect.
 * Provides pairing-friendly curve operations for aggregate signatures.
 * @module
 * @since 0.0.1
 */
export { sign } from './sign.js'
export { verify } from './verify.js'
export { aggregate } from './aggregate.js'
export { Bls12381Service, type Bls12381ServiceShape } from './Bls12381Service.js'
export { Bls12381Live } from './Bls12381Live.js'
