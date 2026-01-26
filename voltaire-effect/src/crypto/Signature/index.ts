/**
 * @fileoverview Signature verification utilities for Effect.
 *
 * @description
 * This module provides comprehensive signature verification operations
 * wrapped in Effect for type-safe, composable cryptographic workflows.
 *
 * Features:
 * - EIP-191 personal_sign message verification
 * - EIP-712 typed data verification
 * - Raw hash signature verification
 * - Address recovery from signatures
 * - Constant-time comparison for timing attack prevention
 *
 * All verification operations use constant-time comparison internally
 * to prevent timing side-channel attacks.
 *
 * @example Verify personal_sign message
 * ```typescript
 * import { verifyMessage, CryptoLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = verifyMessage({
 *   message: 'Hello, Ethereum!',
 *   signature: sig,
 *   address: expectedAddress
 * }).pipe(Effect.provide(CryptoLive))
 *
 * const isValid = await Effect.runPromise(program)
 * ```
 *
 * @example Recover signer address
 * ```typescript
 * import { recoverMessageAddress, CryptoLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = recoverMessageAddress({
 *   message: 'Hello, Ethereum!',
 *   signature: sig
 * }).pipe(Effect.provide(CryptoLive))
 *
 * const address = await Effect.runPromise(program)
 * ```
 *
 * @module Signature
 * @since 0.0.1
 */

// Utility exports
export { constantTimeEqual } from "./constantTimeEqual.js";

// Error exports
export {
	AddressDerivationError,
	RecoverError,
	type SignatureError,
	VerifyError,
} from "./errors.js";

// Hash exports
export { hashMessage } from "./hashMessage.js";
export { hashTypedData } from "../EIP712/index.js";

// Recovery exports
export { recoverAddress, type SignatureInput } from "./recoverAddress.js";
export { recoverMessageAddress } from "./recoverMessageAddress.js";

// Verification exports
export { verifyHash } from "./verifyHash.js";
export { verifyMessage } from "./verifyMessage.js";
export { verifyTypedData } from "./verifyTypedData.js";
