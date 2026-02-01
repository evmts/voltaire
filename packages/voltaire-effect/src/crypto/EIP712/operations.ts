/**
 * @fileoverview EIP-712 typed data operations for Effect.
 * @module EIP712/operations
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type {
	Domain,
	Message,
	Signature,
	TypeDefinitions,
	TypedData,
} from "@tevm/voltaire/EIP712";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import { EIP712Service } from "./EIP712Service.js";

/**
 * Hashes typed structured data according to EIP-712.
 *
 * @description
 * Computes the EIP-712 hash of typed data: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message)).
 * This hash is what gets signed for EIP-712 signatures.
 *
 * @param typedData - The typed data to hash (domain, types, primaryType, message)
 * @returns Effect containing the 32-byte hash, requiring EIP712Service
 *
 * @example
 * ```typescript
 * import { hashTypedData, EIP712Live } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hashTypedData(typedData).pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @throws Never fails if typedData is valid
 * @see {@link signTypedData} to sign the hash
 * @since 0.0.1
 */
export const hashTypedData = (
	typedData: TypedData,
): Effect.Effect<HashType, never, EIP712Service> =>
	Effect.gen(function* () {
		const eip712 = yield* EIP712Service;
		return yield* eip712.hashTypedData(typedData);
	});

/**
 * Signs typed structured data according to EIP-712.
 *
 * @description
 * Signs the EIP-712 hash with a secp256k1 private key. Returns a signature
 * with r, s components and recovery parameter v (27 or 28).
 *
 * @param typedData - The typed data to sign (domain, types, primaryType, message)
 * @param privateKey - The 32-byte private key as bytes or 0x-prefixed hex string
 * @returns Effect containing the signature {r, s, v}, requiring EIP712Service
 *
 * @example
 * ```typescript
 * import { signTypedData, EIP712Live } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const program = signTypedData(typedData, '0x...').pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @throws Never fails if inputs are valid
 * @see {@link verifyTypedData} to verify signatures
 * @see {@link recoverAddress} to recover signer address
 * @since 0.0.1
 */
export const signTypedData = (
	typedData: TypedData,
	privateKey: Uint8Array | string,
): Effect.Effect<Signature, never, EIP712Service> =>
	Effect.gen(function* () {
		const eip712 = yield* EIP712Service;
		return yield* eip712.signTypedData(typedData, privateKey);
	});

/**
 * Verifies an EIP-712 typed data signature.
 *
 * @description
 * Recovers the signer address from the signature and compares it to the
 * expected address. Returns true if they match.
 *
 * @param signature - The signature {r, s, v} to verify
 * @param typedData - The typed data that was signed
 * @param address - The expected 20-byte signer address
 * @returns Effect containing true if signature is valid, requiring EIP712Service
 *
 * @example
 * ```typescript
 * import { verifyTypedData, signTypedData, EIP712Live } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sig = yield* signTypedData(typedData, privateKey)
 *   return yield* verifyTypedData(sig, typedData, address)
 * }).pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @throws Never fails
 * @see {@link signTypedData} to create signatures
 * @since 0.0.1
 */
export const verifyTypedData = (
	signature: Signature,
	typedData: TypedData,
	address: AddressType,
): Effect.Effect<boolean, never, EIP712Service> =>
	Effect.gen(function* () {
		const eip712 = yield* EIP712Service;
		return yield* eip712.verifyTypedData(signature, typedData, address);
	});

/**
 * Recovers the signer address from an EIP-712 signature.
 *
 * @description
 * Uses ecrecover to derive the Ethereum address that created the signature.
 * This is the inverse of signing - given a signature and the original message,
 * we can determine who signed it.
 *
 * @param signature - The signature {r, s, v}
 * @param typedData - The typed data that was signed
 * @returns Effect containing the 20-byte recovered address, requiring EIP712Service
 *
 * @example
 * ```typescript
 * import { recoverAddress, signTypedData, EIP712Live } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sig = yield* signTypedData(typedData, privateKey)
 *   return yield* recoverAddress(sig, typedData)
 * }).pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @throws Never fails if signature is valid
 * @see {@link verifyTypedData} for simpler verification
 * @since 0.0.1
 */
export const recoverAddress = (
	signature: Signature,
	typedData: TypedData,
): Effect.Effect<AddressType, never, EIP712Service> =>
	Effect.gen(function* () {
		const eip712 = yield* EIP712Service;
		return yield* eip712.recoverAddress(signature, typedData);
	});

/**
 * Hashes a domain separator according to EIP-712.
 *
 * @description
 * Computes hashStruct for the EIP712Domain type. The domain separator
 * ensures signatures are unique to a specific contract/chain/version.
 *
 * @param domain - Domain parameters {name?, version?, chainId?, verifyingContract?, salt?}
 * @returns Effect containing the 32-byte domain separator hash, requiring EIP712Service
 *
 * @example
 * ```typescript
 * import { hashDomain, EIP712Live } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const domain = { name: 'MyDApp', version: '1', chainId: 1 }
 * const program = hashDomain(domain).pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @throws Never fails if domain is valid
 * @see {@link hashStruct} for arbitrary struct hashing
 * @since 0.0.1
 */
export const hashDomain = (
	domain: Domain,
): Effect.Effect<HashType, never, EIP712Service> =>
	Effect.gen(function* () {
		const eip712 = yield* EIP712Service;
		return yield* eip712.hashDomain(domain);
	});

/**
 * Hashes a struct according to EIP-712 encoding.
 *
 * @description
 * Computes hashStruct(primaryType, data) = keccak256(typeHash ‖ encodeData(data)).
 * Used internally for message and domain hashing.
 *
 * @param primaryType - The name of the primary struct type (e.g., "Person")
 * @param data - The struct data matching the type definition
 * @param types - Type definitions mapping type names to field arrays
 * @returns Effect containing the 32-byte struct hash, requiring EIP712Service
 *
 * @example
 * ```typescript
 * import { hashStruct, EIP712Live } from 'voltaire-effect/crypto/EIP712'
 * import * as Effect from 'effect/Effect'
 *
 * const types = { Person: [{ name: 'name', type: 'string' }] }
 * const program = hashStruct('Person', { name: 'Alice' }, types)
 *   .pipe(Effect.provide(EIP712Live))
 * ```
 *
 * @throws Never fails if inputs are valid
 * @see {@link hashDomain} for domain separator hashing
 * @since 0.0.1
 */
export const hashStruct = (
	primaryType: string,
	data: Message,
	types: TypeDefinitions,
): Effect.Effect<HashType, never, EIP712Service> =>
	Effect.gen(function* () {
		const eip712 = yield* EIP712Service;
		return yield* eip712.hashStruct(primaryType, data, types);
	});
