/**
 * @fileoverview BLS12-381 cryptographic signature module for Effect.
 *
 * @description
 * Provides BLS12-381 pairing-friendly elliptic curve operations for
 * aggregate signatures. BLS12-381 is used extensively in Ethereum 2.0
 * for validator attestations and beacon chain consensus.
 *
 * Key features:
 * - Signature aggregation (n signatures → 1 signature)
 * - 48-byte public keys, 96-byte signatures
 * - Pairing-based cryptography
 * - Used in Ethereum 2.0, Zcash, Filecoin
 * - Efficient batch verification
 *
 * @example
 * ```typescript
 * import { sign, verify, aggregate, Bls12381Live } from 'voltaire-effect/crypto/Bls12381'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sig1 = yield* sign(message1, privateKey1)
 *   const sig2 = yield* sign(message2, privateKey2)
 *   const aggregated = yield* aggregate([sig1, sig2])
 *   const isValid = yield* verify(sig1, message1, publicKey1)
 *   return { aggregated, isValid }
 * })
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @module Bls12381
 * @since 0.0.1
 */

export { aggregate } from "./aggregate.js";
export { Bls12381Live } from "./Bls12381Live.js";
export {
	Bls12381Service,
	type Bls12381ServiceShape,
} from "./Bls12381Service.js";
export { sign } from "./sign.js";
export { verify } from "./verify.js";
