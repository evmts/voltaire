/**
 * @fileoverview Test layer for Secp256k1Service.
 * Provides deterministic mock values for unit testing.
 *
 * @module Secp256k1/Secp256k1Test
 * @since 0.0.1
 */

import type {
	Secp256k1PublicKeyType,
	Secp256k1SignatureType,
} from "@tevm/voltaire/Secp256k1";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
	Secp256k1Service,
	type Secp256k1ServiceShape,
} from "./Secp256k1Service.js";

/**
 * Mock 65-byte signature filled with zeros.
 * @internal
 */
const mockSignature = new Uint8Array(65) as unknown as Secp256k1SignatureType;

/**
 * Mock 65-byte public key filled with zeros.
 * @internal
 */
const mockPublicKey = new Uint8Array(65) as unknown as Secp256k1PublicKeyType;

/**
 * Test implementation of Secp256k1ServiceShape.
 * @internal
 */
const testImpl: Secp256k1ServiceShape = {
	sign: (_messageHash, _privateKey, _options) => Effect.succeed(mockSignature),
	recover: (_signature, _messageHash) => Effect.succeed(mockPublicKey),
	verify: (_signature, _messageHash, _publicKey) => Effect.succeed(true),
};

/**
 * Test layer for Secp256k1Service returning deterministic mock values.
 *
 * @description
 * Provides a mock secp256k1 implementation for unit testing without
 * cryptographic overhead. All operations return deterministic values:
 * - `sign` returns a 65-byte zero-filled signature
 * - `recover` returns a 65-byte zero-filled public key
 * - `verify` always returns `true`
 *
 * This layer is useful for:
 * - Unit tests that need deterministic output
 * - Performance tests that want to isolate non-crypto logic
 * - Tests where cryptographic correctness is not the focus
 *
 * @example Using in tests
 * ```typescript
 * import { Secp256k1Service, Secp256k1Test } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 * import { describe, it, expect } from 'vitest'
 *
 * describe('TransactionService', () => {
 *   it('should sign transactions', async () => {
 *     const program = Effect.gen(function* () {
 *       const secp = yield* Secp256k1Service
 *       return yield* secp.sign(fakeHash, fakeKey)
 *     })
 *
 *     const sig = await Effect.runPromise(program.pipe(Effect.provide(Secp256k1Test)))
 *     expect(sig.length).toBe(65)
 *   })
 *
 *   it('should verify returns true in test mode', async () => {
 *     const program = Effect.gen(function* () {
 *       const secp = yield* Secp256k1Service
 *       return yield* secp.verify(fakeSig, fakeHash, fakePubKey)
 *     })
 *
 *     const isValid = await Effect.runPromise(program.pipe(Effect.provide(Secp256k1Test)))
 *     expect(isValid).toBe(true)
 *   })
 * })
 * ```
 *
 * @example Combining with other test layers
 * ```typescript
 * import { Secp256k1Test } from 'voltaire-effect/crypto/Secp256k1'
 * import { KeccakTest } from 'voltaire-effect/crypto/Keccak256'
 * import * as Layer from 'effect/Layer'
 *
 * const CryptoTest = Layer.merge(Secp256k1Test, KeccakTest)
 *
 * const result = await Effect.runPromise(program.pipe(Effect.provide(CryptoTest)))
 * ```
 *
 * @see {@link Secp256k1Service} - The service tag
 * @see {@link Secp256k1Live} - Production implementation
 * @since 0.0.1
 */
export const Secp256k1Test = Layer.succeed(Secp256k1Service, testImpl);
