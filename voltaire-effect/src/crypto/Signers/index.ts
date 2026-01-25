/**
 * @fileoverview Ethereum signers module for Effect.
 * Provides cryptographic signing of messages, transactions, and typed data.
 *
 * @module Signers
 * @since 0.0.1
 *
 * @description
 * Signers handle cryptographic signing operations for Ethereum. Each signer
 * encapsulates a private key and provides methods for:
 *
 * - Message signing (EIP-191 personal_sign)
 * - Transaction signing
 * - Typed data signing (EIP-712)
 *
 * @example
 * ```typescript
 * import { SignersService, SignersLive, fromPrivateKey, getAddress } from 'voltaire-effect/crypto/Signers'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* fromPrivateKey('0x...')
 *   const address = yield* getAddress(signer)
 *   const sig = yield* signer.signMessage('Hello World')
 *   return { address, sig }
 * }).pipe(Effect.provide(SignersLive))
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-191 | EIP-191}
 * @see {@link https://eips.ethereum.org/EIPS/eip-712 | EIP-712}
 */
export {
	fromPrivateKey,
	getAddress,
	getAddress as getSignerAddress,
	recoverTransactionAddress,
} from "./operations.js";
export { SignersLive } from "./SignersLive.js";
export {
	type Signer,
	SignersService,
	type SignersServiceShape,
} from "./SignersService.js";
export { SignersTest } from "./SignersTest.js";
