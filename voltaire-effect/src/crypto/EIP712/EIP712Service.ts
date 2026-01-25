/**
 * @fileoverview EIP712Service Effect service definition for typed data signing.
 * @module EIP712/EIP712Service
 * @since 0.0.1
 */
import { EIP712 } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire/Address";
import type {
	Domain,
	Message,
	Signature,
	TypeDefinitions,
	TypedData,
} from "@tevm/voltaire/EIP712";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Shape interface for EIP-712 typed data operations.
 *
 * @description
 * Defines the contract for EIP-712 implementations. All methods return Effect
 * types for composable, type-safe async/error handling.
 *
 * @since 0.0.1
 */
export interface EIP712ServiceShape {
	/**
	 * Hashes typed structured data according to EIP-712.
	 * @param typedData - The typed data to hash
	 * @returns Effect containing the 32-byte hash
	 */
	readonly hashTypedData: (typedData: TypedData) => Effect.Effect<HashType>;

	/**
	 * Signs typed structured data according to EIP-712.
	 * @param typedData - The typed data to sign
	 * @param privateKey - The private key as bytes or hex string
	 * @returns Effect containing the signature
	 */
	readonly signTypedData: (
		typedData: TypedData,
		privateKey: Uint8Array | string,
	) => Effect.Effect<Signature>;

	/**
	 * Verifies an EIP-712 typed data signature.
	 * @param signature - The signature to verify
	 * @param typedData - The typed data that was signed
	 * @param address - The expected signer address
	 * @returns Effect containing true if valid
	 */
	readonly verifyTypedData: (
		signature: Signature,
		typedData: TypedData,
		address: AddressType,
	) => Effect.Effect<boolean>;

	/**
	 * Recovers the signer address from an EIP-712 signature.
	 * @param signature - The signature
	 * @param typedData - The typed data that was signed
	 * @returns Effect containing the recovered address
	 */
	readonly recoverAddress: (
		signature: Signature,
		typedData: TypedData,
	) => Effect.Effect<AddressType>;

	/**
	 * Hashes a domain separator according to EIP-712.
	 * @param domain - The domain parameters
	 * @returns Effect containing the 32-byte domain hash
	 */
	readonly hashDomain: (domain: Domain) => Effect.Effect<HashType>;

	/**
	 * Hashes a struct according to EIP-712 encoding.
	 * @param primaryType - The primary type name
	 * @param data - The struct data
	 * @param types - The type definitions
	 * @returns Effect containing the 32-byte struct hash
	 */
	readonly hashStruct: (
		primaryType: string,
		data: Message,
		types: TypeDefinitions,
	) => Effect.Effect<HashType>;
}

/**
 * EIP-712 typed structured data service for Effect-based applications.
 * Provides standard Ethereum typed data signing and verification.
 *
 * @example
 * ```typescript
 * import { EIP712Service, EIP712Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const eip712 = yield* EIP712Service
 *   const sig = yield* eip712.signTypedData(typedData, privateKey)
 *   return yield* eip712.verifyTypedData(sig, typedData, address)
 * }).pipe(Effect.provide(EIP712Live))
 * ```
 * @since 0.0.1
 */
export class EIP712Service extends Context.Tag("EIP712Service")<
	EIP712Service,
	EIP712ServiceShape
>() {}

/**
 * Production layer for EIP712Service using native EIP-712 implementation.
 *
 * @description
 * Provides real EIP-712 operations using proper encoding and secp256k1 signing.
 * Follows the exact specification for domain separator and struct hashing.
 *
 * @example
 * ```typescript
 * import { EIP712Service, EIP712Live } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const eip712 = yield* EIP712Service
 *   return yield* eip712.signTypedData(typedData, privateKey)
 * }).pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @since 0.0.1
 * @see {@link EIP712Test} for unit testing
 */
export const EIP712Live = Layer.succeed(EIP712Service, {
	hashTypedData: (typedData) =>
		Effect.sync(() => EIP712.hashTypedData(typedData)),
	signTypedData: (typedData, privateKey) =>
		Effect.sync(() => EIP712.signTypedData(typedData, privateKey)),
	verifyTypedData: (signature, typedData, address) =>
		Effect.sync(() => EIP712.verifyTypedData(signature, typedData, address)),
	recoverAddress: (signature, typedData) =>
		Effect.sync(() => EIP712.recoverAddress(signature, typedData)),
	hashDomain: (domain) => Effect.sync(() => EIP712.Domain.hash(domain)),
	hashStruct: (primaryType, data, types) =>
		Effect.sync(() => EIP712.hashStruct(primaryType, data, types)),
});

const mockHash = new Uint8Array(32) as HashType;
const mockAddress = new Uint8Array(20) as AddressType;
const mockSignature: Signature = {
	r: new Uint8Array(32),
	s: new Uint8Array(32),
	v: 27,
};

/**
 * Test layer for EIP712Service returning deterministic mock values.
 *
 * @description
 * Provides mock implementations for unit testing. Returns zero-filled
 * hashes, addresses, and signatures, and always verifies as true.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { EIP712Service, EIP712Test, signTypedData } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = signTypedData(typedData, privateKey).pipe(Effect.provide(EIP712Test))
 * // Returns mock signature
 * ```
 *
 * @since 0.0.1
 */
export const EIP712Test = Layer.succeed(EIP712Service, {
	hashTypedData: (_typedData) => Effect.succeed(mockHash),
	signTypedData: (_typedData, _privateKey) => Effect.succeed(mockSignature),
	verifyTypedData: (_signature, _typedData, _address) => Effect.succeed(true),
	recoverAddress: (_signature, _typedData) => Effect.succeed(mockAddress),
	hashDomain: (_domain) => Effect.succeed(mockHash),
	hashStruct: (_primaryType, _data, _types) => Effect.succeed(mockHash),
});
