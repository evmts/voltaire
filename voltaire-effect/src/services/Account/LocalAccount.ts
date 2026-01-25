/**
 * @fileoverview Local account implementation for private key signing.
 *
 * @module LocalAccount
 * @since 0.0.1
 *
 * @description
 * Provides a local account implementation that signs messages and transactions
 * using a private key stored in memory. All cryptographic operations are
 * performed locally using secp256k1 and keccak256.
 *
 * Security considerations:
 * - Private keys are kept in memory
 * - Suitable for server-side applications
 * - Use hardware wallets for production user funds
 *
 * Requires:
 * - Secp256k1Service - For ECDSA signing
 * - KeccakService - For message hashing
 *
 * @see {@link AccountService} - The service interface
 * @see {@link JsonRpcAccount} - Alternative for remote signing
 * @see {@link SignerService} - Uses AccountService for transactions
 */

import {
	Address,
	type BrandedAddress,
	type BrandedHash,
	type BrandedHex,
	type BrandedSignature,
	Hex,
	Rlp,
	Secp256k1,
	type TypedData,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { KeccakService } from "../../crypto/Keccak256/index.js";
import { Secp256k1Service } from "../../crypto/Secp256k1/index.js";
import {
	AccountError,
	AccountService,
	type UnsignedTransaction,
} from "./AccountService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type HashType = BrandedHash.HashType;
type TypedDataType = TypedData.TypedDataType;
type PrivateKeyType = Uint8Array & { readonly __brand: "PrivateKey" };

/**
 * EIP-191 prefix for personal_sign messages.
 * @see https://eips.ethereum.org/EIPS/eip-191
 */
const EIP191_PREFIX = "\x19Ethereum Signed Message:\n";

function deriveAddressFromPublicKey(
	_publicKey: Uint8Array,
	keccakHash: Uint8Array,
): AddressType {
	const addressBytes = keccakHash.slice(12);
	return addressBytes as AddressType;
}

function bigintToRlpBytes(value: bigint): Uint8Array {
	if (value === 0n) return new Uint8Array(0);
	let hex = value.toString(16);
	if (hex.length % 2 !== 0) hex = `0${hex}`;
	return Hex.toBytes(`0x${hex}` as HexType);
}

function serializeUnsignedTransaction(tx: UnsignedTransaction): Uint8Array {
	const items: (Uint8Array | readonly Uint8Array[])[] = [
		tx.nonce !== undefined ? bigintToRlpBytes(tx.nonce) : new Uint8Array(0),
		tx.gasPrice !== undefined
			? bigintToRlpBytes(tx.gasPrice)
			: new Uint8Array(0),
		tx.gasLimit !== undefined
			? bigintToRlpBytes(tx.gasLimit)
			: new Uint8Array(0),
		tx.to ? Address.toBytes(tx.to) : new Uint8Array(0),
		tx.value !== undefined ? bigintToRlpBytes(tx.value) : new Uint8Array(0),
		tx.data ? Hex.toBytes(tx.data) : new Uint8Array(0),
	];

	if (tx.chainId !== undefined) {
		items.push(bigintToRlpBytes(tx.chainId));
		items.push(new Uint8Array(0));
		items.push(new Uint8Array(0));
	}

	return Rlp.encode(items);
}

function encodeTypedDataHash(
	typedData: TypedDataType,
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	return Effect.gen(function* () {
		const domainSeparator = yield* hashDomain(typedData.domain, keccak256);
		const structHash = yield* hashStruct(
			typedData.primaryType,
			typedData.message as Record<string, unknown>,
			typedData.types,
			keccak256,
		);

		const packed = new Uint8Array(66);
		packed[0] = 0x19;
		packed[1] = 0x01;
		packed.set(domainSeparator, 2);
		packed.set(structHash, 34);

		return yield* keccak256(packed);
	});
}

function hashDomain(
	domain: TypedDataType["domain"],
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	return Effect.gen(function* () {
		const types: Array<{ name: string; type: string }> = [];
		const values: unknown[] = [];

		if (domain.name !== undefined) {
			types.push({ name: "name", type: "string" });
			values.push(domain.name);
		}
		if (domain.version !== undefined) {
			types.push({ name: "version", type: "string" });
			values.push(domain.version);
		}
		if (domain.chainId !== undefined) {
			types.push({ name: "chainId", type: "uint256" });
			values.push(domain.chainId);
		}
		if (domain.verifyingContract !== undefined) {
			types.push({ name: "verifyingContract", type: "address" });
			values.push(domain.verifyingContract);
		}
		if (domain.salt !== undefined) {
			types.push({ name: "salt", type: "bytes32" });
			values.push(domain.salt);
		}

		const typeHash = yield* hashType("EIP712Domain", types, keccak256);
		const encodedValues = yield* encodeData(
			types,
			Object.fromEntries(types.map((t, i) => [t.name, values[i]])),
			keccak256,
		);

		const combined = new Uint8Array(typeHash.length + encodedValues.length);
		combined.set(typeHash);
		combined.set(encodedValues, typeHash.length);

		return yield* keccak256(combined);
	});
}

function hashStruct(
	primaryType: string,
	message: Record<string, unknown>,
	types: Record<string, readonly { name: string; type: string }[]>,
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	return Effect.gen(function* () {
		const typeFields = types[primaryType] ?? [];
		const typeHash = yield* hashType(primaryType, typeFields, keccak256);
		const encodedData = yield* encodeData(typeFields, message, keccak256);

		const combined = new Uint8Array(typeHash.length + encodedData.length);
		combined.set(typeHash);
		combined.set(encodedData, typeHash.length);

		return yield* keccak256(combined);
	});
}

function hashType(
	name: string,
	fields: readonly { name: string; type: string }[],
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	const typeString = `${name}(${fields.map((f) => `${f.type} ${f.name}`).join(",")})`;
	const encoder = new TextEncoder();
	return keccak256(encoder.encode(typeString));
}

function encodeData(
	fields: readonly { name: string; type: string }[],
	data: Record<string, unknown>,
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	return Effect.gen(function* () {
		const chunks: Uint8Array[] = [];

		for (const field of fields) {
			const value = data[field.name];
			const encoded = yield* encodeValue(field.type, value, keccak256);
			chunks.push(encoded);
		}

		const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			result.set(chunk, offset);
			offset += chunk.length;
		}

		return result;
	});
}

function encodeValue(
	type: string,
	value: unknown,
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	return Effect.gen(function* () {
		if (type === "string") {
			const encoder = new TextEncoder();
			const hash = yield* keccak256(encoder.encode(value as string));
			return hash;
		}
		if (type === "bytes") {
			const hash = yield* keccak256(value as Uint8Array);
			return hash;
		}
		if (type.startsWith("uint") || type.startsWith("int")) {
			const bytes = new Uint8Array(32);
			let n = BigInt(value as bigint | number);
			for (let i = 31; i >= 0; i--) {
				bytes[i] = Number(n & 0xffn);
				n >>= 8n;
			}
			return bytes;
		}
		if (type === "address") {
			const bytes = new Uint8Array(32);
			const addrBytes =
				typeof value === "string"
					? Hex.toBytes(value as HexType)
					: Address.toBytes(value as AddressType);
			bytes.set(addrBytes, 12);
			return bytes;
		}
		if (type === "bool") {
			const bytes = new Uint8Array(32);
			bytes[31] = value ? 1 : 0;
			return bytes;
		}
		if (type.startsWith("bytes")) {
			const size = Number.parseInt(type.slice(5), 10);
			const bytes = new Uint8Array(32);
			const src =
				value instanceof Uint8Array ? value : Hex.toBytes(value as HexType);
			bytes.set(src.slice(0, size));
			return bytes;
		}
		return new Uint8Array(32);
	});
}

/**
 * Creates a local account layer from a private key.
 *
 * @description
 * Signs messages and transactions locally using secp256k1.
 * The private key is kept in memory and used for all signing operations.
 * The account address is derived from the public key.
 *
 * Requires Secp256k1Service and KeccakService for cryptographic operations.
 *
 * Security considerations:
 * - Private key is stored in memory
 * - Suitable for server-side applications or testing
 * - For user funds in production, prefer hardware wallets
 *
 * @param privateKeyHex - The private key as a hex string (with 0x prefix)
 * @returns Layer providing AccountService (requires Secp256k1Service and KeccakService)
 *
 * @throws {AccountError} When signing operations fail
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   AccountService,
 *   LocalAccount,
 *   Secp256k1Live,
 *   KeccakLive
 * } from 'voltaire-effect/services'
 * import { Hex } from '@tevm/voltaire'
 *
 * const privateKey = Hex.fromHex('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   console.log('Address:', account.address)
 *   const signature = yield* account.signMessage(messageHex)
 *   return signature
 * }).pipe(
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(Secp256k1Live),
 *   Effect.provide(KeccakLive)
 * )
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example With Signer for transactions
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   SignerService,
 *   Signer,
 *   LocalAccount,
 *   Provider,
 *   HttpTransport,
 *   Secp256k1Live,
 *   KeccakLive
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* SignerService
 *   const txHash = yield* signer.sendTransaction({
 *     to: recipientAddress,
 *     value: 1000000000000000000n
 *   })
 *   return txHash
 * }).pipe(
 *   Effect.provide(Signer.Live),
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(Secp256k1Live),
 *   Effect.provide(KeccakLive),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link AccountService} - The service interface
 * @see {@link JsonRpcAccount} - Alternative for remote signing
 * @see {@link Secp256k1Service} - Required cryptographic dependency
 * @see {@link KeccakService} - Required cryptographic dependency
 */
export const LocalAccount = (privateKeyHex: HexType) =>
	Layer.effect(
		AccountService,
		Effect.gen(function* () {
			const secp256k1 = yield* Secp256k1Service;
			const keccak = yield* KeccakService;

			const privateKeyBytes = Hex.toBytes(
				privateKeyHex,
			) as unknown as PrivateKeyType;
			const publicKey = Secp256k1.derivePublicKey(
				privateKeyBytes as unknown as Parameters<
					typeof Secp256k1.derivePublicKey
				>[0],
			);
			const addressHash = yield* keccak.hash(publicKey);
			const address = deriveAddressFromPublicKey(publicKey, addressHash);

			const keccakHash = (data: Uint8Array) => keccak.hash(data);

			return AccountService.of({
				address,
				type: "local" as const,

				signMessage: (message: HexType) =>
					Effect.gen(function* () {
						const messageBytes = Hex.toBytes(message);
						const prefix = new TextEncoder().encode(
							`${EIP191_PREFIX}${messageBytes.length}`,
						);
						const prefixedMessage = new Uint8Array(
							prefix.length + messageBytes.length,
						);
						prefixedMessage.set(prefix);
						prefixedMessage.set(messageBytes, prefix.length);
						const hash = yield* keccak.hash(prefixedMessage);
						const sig = yield* secp256k1.sign(
							hash as unknown as HashType,
							privateKeyBytes,
						);
						return sig as unknown as SignatureType;
					}).pipe(
						Effect.mapError(
							(e) =>
								new AccountError(
									{ action: "signMessage" },
									"Failed to sign message",
									{ cause: e instanceof Error ? e : undefined },
								),
						),
					),

				signTransaction: (tx: UnsignedTransaction) =>
					Effect.gen(function* () {
						const serialized = serializeUnsignedTransaction(tx);
						const hash = yield* keccak.hash(serialized);
						const sig = yield* secp256k1.sign(
							hash as unknown as HashType,
							privateKeyBytes,
						);
						return sig as unknown as SignatureType;
					}).pipe(
						Effect.mapError(
							(e) =>
								new AccountError(
									{ action: "signTransaction" },
									"Failed to sign transaction",
									{ cause: e instanceof Error ? e : undefined },
								),
						),
					),

				signTypedData: (typedData: TypedDataType) =>
					Effect.gen(function* () {
						const hash = yield* encodeTypedDataHash(typedData, keccakHash);
						const sig = yield* secp256k1.sign(
							hash as unknown as HashType,
							privateKeyBytes,
						);
						return sig as unknown as SignatureType;
					}).pipe(
						Effect.mapError(
							(e) =>
								new AccountError(
									{ action: "signTypedData" },
									"Failed to sign typed data",
									{ cause: e instanceof Error ? e : undefined },
								),
						),
					),
			});
		}),
	);
