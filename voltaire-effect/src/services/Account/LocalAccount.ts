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
	Secp256k1,
	Signature,
	type TypedData,
} from "@tevm/voltaire";
import * as Hash from "@tevm/voltaire/Hash";
import type { Secp256k1SignatureType } from "@tevm/voltaire/Secp256k1";
import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import {
	KeccakService,
	type KeccakServiceShape,
} from "../../crypto/Keccak256/index.js";
import {
	Secp256k1Service,
	type Secp256k1ServiceShape,
} from "../../crypto/Secp256k1/index.js";
import {
	AccountError,
	AccountService,
	type SignAuthorizationParams,
	type UnsignedAuthorization,
	type UnsignedTransaction,
} from "./AccountService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type HashType = BrandedHash.HashType;
type TypedDataType = TypedData.TypedDataType;
type PrivateKeyType = Uint8Array & { readonly __brand: "PrivateKey" };
type AddressInput = AddressType | `0x${string}`;
type RedactedPrivateKey = ReturnType<typeof Redacted.make<PrivateKeyType>>;
type PrivateKeyState = {
	readonly bytes: PrivateKeyType;
	readonly redacted: RedactedPrivateKey;
};

/**
 * EIP-191 prefix for personal_sign messages.
 * @see https://eips.ethereum.org/EIPS/eip-191
 */
const EIP191_PREFIX = "\x19Ethereum Signed Message:\n";
const ZERO_SIGNATURE = new Uint8Array(32);

const toUncompressedPublicKeyBytes = (publicKey: Uint8Array): Uint8Array => {
	if (publicKey.length === 65) return publicKey;
	const uncompressed = new Uint8Array(65);
	uncompressed[0] = 0x04;
	uncompressed.set(publicKey, 1);
	return uncompressed;
};

const stripPublicKeyPrefix = (publicKey: Uint8Array): Uint8Array =>
	publicKey.length === 65 && publicKey[0] === 0x04
		? publicKey.slice(1)
		: publicKey;

function deriveAddressFromPublicKey(
	_publicKey: Uint8Array,
	keccakHash: Uint8Array,
): AddressType {
	const addressBytes = keccakHash.slice(12);
	return addressBytes as AddressType;
}

const isSecp256k1Signature = (
	signature: Secp256k1SignatureType | Uint8Array,
): signature is Secp256k1SignatureType =>
	typeof signature === "object" &&
	signature !== null &&
	"r" in signature &&
	"s" in signature &&
	"v" in signature;

const isSignatureBytes = (signature: Uint8Array): signature is SignatureType =>
	typeof (signature as SignatureType).algorithm === "string";

const toSignatureType = (
	signature: Secp256k1SignatureType | Uint8Array,
): SignatureType => {
	if (isSecp256k1Signature(signature)) {
		return Signature.fromSecp256k1(
			signature.r,
			signature.s,
			signature.v,
		) as SignatureType;
	}
	if (isSignatureBytes(signature)) return signature as SignatureType;
	return Signature.fromBytes(signature) as SignatureType;
};

const toAddressType = (address: AddressInput): AddressType =>
	typeof address === "string" ? Address.fromHex(address) : address;

const toAuthorizationParity = (auth: {
	yParity?: number;
	v?: number;
}): number => {
	if (auth.yParity !== undefined) return auth.yParity;
	if (auth.v !== undefined) {
		if (auth.v === 27 || auth.v === 28) return auth.v - 27;
		return auth.v % 2;
	}
	return 0;
};

const toError = (cause: unknown): Error =>
	cause instanceof Error ? cause : new Error(String(cause));

const normalizeAccessList = (
	accessList?: UnsignedTransaction["accessList"],
): VoltaireTransaction.AccessList =>
	(accessList ?? []).map((item) => ({
		address: toAddressType(item.address),
		storageKeys: item.storageKeys.map((key) => Hash.fromHex(key)),
	}));

const normalizeAuthorizationList = (
	authorizationList?: UnsignedTransaction["authorizationList"],
): VoltaireTransaction.AuthorizationList =>
	(authorizationList ?? []).map((auth) => ({
		chainId: auth.chainId,
		address: Address.fromHex(auth.address),
		nonce: auth.nonce,
		yParity: toAuthorizationParity(auth),
		r: Hex.toBytes(auth.r as HexType),
		s: Hex.toBytes(auth.s as HexType),
	}));

const toUnsignedAuthorization = (
	authorization: UnsignedAuthorization | SignAuthorizationParams,
): UnsignedAuthorization => {
	if (authorization.nonce === undefined) {
		throw new Error("Authorization nonce is required");
	}
	const address =
		"contractAddress" in authorization
			? authorization.contractAddress
			: authorization.address;
	return {
		chainId: authorization.chainId,
		address,
		nonce: authorization.nonce,
	};
};

const getTransactionType = (tx: UnsignedTransaction): 0 | 1 | 2 | 3 | 4 => {
	if (tx.type !== undefined) return tx.type;
	if (tx.authorizationList !== undefined) return 4;
	const hasBlobFields =
		tx.blobVersionedHashes !== undefined ||
		tx.maxFeePerBlobGas !== undefined ||
		tx.blobs !== undefined ||
		tx.kzgCommitments !== undefined ||
		tx.kzgProofs !== undefined;
	if (hasBlobFields) return 3;
	if (tx.maxFeePerGas !== undefined || tx.maxPriorityFeePerGas !== undefined)
		return 2;
	if (tx.accessList !== undefined && tx.gasPrice !== undefined) return 1;
	return 0;
};

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
		const domainFields: Array<{ name: string; type: string }> = [];
		const values: unknown[] = [];

		if (domain.name !== undefined) {
			domainFields.push({ name: "name", type: "string" });
			values.push(domain.name);
		}
		if (domain.version !== undefined) {
			domainFields.push({ name: "version", type: "string" });
			values.push(domain.version);
		}
		if (domain.chainId !== undefined) {
			domainFields.push({ name: "chainId", type: "uint256" });
			values.push(domain.chainId);
		}
		if (domain.verifyingContract !== undefined) {
			domainFields.push({ name: "verifyingContract", type: "address" });
			values.push(domain.verifyingContract);
		}
		if (domain.salt !== undefined) {
			domainFields.push({ name: "salt", type: "bytes32" });
			values.push(domain.salt);
		}

		const domainTypes = { EIP712Domain: domainFields };
		const typeHash = yield* hashType("EIP712Domain", domainTypes, keccak256);
		const encodedValues = yield* encodeData(
			domainFields,
			Object.fromEntries(domainFields.map((t, i) => [t.name, values[i]])),
			domainTypes,
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
		const typeHash = yield* hashType(primaryType, types, keccak256);
		const encodedData = yield* encodeData(
			typeFields,
			message,
			types,
			keccak256,
		);

		const combined = new Uint8Array(typeHash.length + encodedData.length);
		combined.set(typeHash);
		combined.set(encodedData, typeHash.length);

		return yield* keccak256(combined);
	});
}

function findTypeDependencies(
	primaryType: string,
	types: Record<string, readonly { name: string; type: string }[]>,
	result: Set<string> = new Set(),
): Set<string> {
	const match = primaryType.match(/^\w*/u);
	const baseType = match?.[0] ?? primaryType;

	if (result.has(baseType)) return result;
	if (baseType === "EIP712Domain") return result;

	const fields = types[baseType];
	if (!fields) return result;

	result.add(baseType);

	for (const field of fields) {
		findTypeDependencies(field.type, types, result);
	}

	return result;
}

function encodeType(
	primaryType: string,
	types: Record<string, readonly { name: string; type: string }[]>,
): string {
	const deps = findTypeDependencies(primaryType, types);
	const sorted = [...deps].filter((t) => t !== primaryType).sort();
	const allTypes = [primaryType, ...sorted];

	return allTypes
		.map((name) => {
			const fields = types[name] ?? [];
			return `${name}(${fields.map((f) => `${f.type} ${f.name}`).join(",")})`;
		})
		.join("");
}

function hashType(
	primaryType: string,
	types: Record<string, readonly { name: string; type: string }[]>,
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	const typeString = encodeType(primaryType, types);
	const encoder = new TextEncoder();
	return keccak256(encoder.encode(typeString));
}

function encodeData(
	fields: readonly { name: string; type: string }[],
	data: Record<string, unknown>,
	types: Record<string, readonly { name: string; type: string }[]>,
	keccak256: (data: Uint8Array) => Effect.Effect<Uint8Array>,
): Effect.Effect<Uint8Array> {
	return Effect.gen(function* () {
		const chunks: Uint8Array[] = [];

		for (const field of fields) {
			const value = data[field.name];
			const encoded = yield* encodeValue(field.type, value, types, keccak256);
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
	types: Record<string, readonly { name: string; type: string }[]>,
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
		const arrayMatch = type.match(/^(.+?)(\[\d*\])$/);
		if (arrayMatch) {
			const baseType = arrayMatch[1];
			const arr = value as unknown[];
			const encodedElements: Uint8Array[] = [];
			for (const element of arr) {
				const encoded = yield* encodeValue(baseType, element, types, keccak256);
				encodedElements.push(encoded);
			}
			const totalLen = encodedElements.reduce((s, e) => s + e.length, 0);
			const concat = new Uint8Array(totalLen);
			let off = 0;
			for (const e of encodedElements) {
				concat.set(e, off);
				off += e.length;
			}
			return yield* keccak256(concat);
		}
		if (types[type]) {
			return yield* hashStruct(
				type,
				value as Record<string, unknown>,
				types,
				keccak256,
			);
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
 * } from 'voltaire-effect'
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
 * } from 'voltaire-effect'
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
/**
 * Securely zeros out private key bytes to prevent memory leakage.
 * @internal
 */
const zeroOutKeyBytes = (keyBytes: Uint8Array): Effect.Effect<void> =>
	Effect.sync(() => {
		keyBytes.fill(0);
	});

const createPrivateKeyState = (privateKeyHex: HexType): PrivateKeyState => {
	const keyBytes = Hex.toBytes(privateKeyHex) as unknown as PrivateKeyType;
	return {
		bytes: keyBytes,
		redacted: Redacted.make(keyBytes),
	};
};

/**
 * Acquires a private key with automatic cleanup when scope closes.
 * Uses Effect.acquireRelease to ensure key bytes are zeroed on cleanup.
 * @internal
 */
const acquirePrivateKey = (privateKeyHex: HexType) =>
	Effect.acquireRelease(
		Effect.sync(() => createPrivateKeyState(privateKeyHex)),
		(key) => zeroOutKeyBytes(key.bytes),
	);

const buildLocalAccount = (
	privateKey: PrivateKeyState,
	secp256k1: Secp256k1ServiceShape,
	keccak: KeccakServiceShape,
) =>
	Effect.gen(function* () {
		const redactedPrivateKey = privateKey.redacted;
		const privateKeyBytes = privateKey.bytes;

		const publicKeyBytes = Secp256k1.derivePublicKey(
			Redacted.value(redactedPrivateKey) as unknown as Parameters<
				typeof Secp256k1.derivePublicKey
			>[0],
		);
		const publicKeyHex = Hex.fromBytes(
			toUncompressedPublicKeyBytes(publicKeyBytes),
		) as HexType;
		const publicKeyForAddress = stripPublicKeyPrefix(publicKeyBytes);
		const addressHash = yield* keccak.hash(publicKeyForAddress);
		const address = deriveAddressFromPublicKey(
			publicKeyForAddress,
			addressHash,
		);

		const keccakHash = (data: Uint8Array) => keccak.hash(data);

		return AccountService.of({
			address,
			type: "local" as const,
			publicKey: publicKeyHex,

			clearKey: () => zeroOutKeyBytes(privateKeyBytes),

			sign: (params: { hash: HexType }) =>
				Effect.gen(function* () {
					const hashBytes = Hex.toBytes(params.hash);
					if (hashBytes.length !== 32) {
						return yield* Effect.fail(
							new AccountError(
								{ action: "sign", hash: params.hash },
								`Hash must be 32 bytes, got ${hashBytes.length}`,
							),
						);
					}
					const sig = yield* secp256k1.sign(
						hashBytes as unknown as HashType,
						Redacted.value(redactedPrivateKey),
					);
					return toSignatureType(sig);
				}).pipe(
					Effect.mapError((e) =>
						e instanceof AccountError
							? e
							: new AccountError(
									{ action: "sign", hash: params.hash },
									"Failed to sign hash",
									{ cause: e instanceof Error ? e : undefined },
								),
					),
				),

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
						Redacted.value(redactedPrivateKey),
					);
					return toSignatureType(sig);
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
					const signingTx = yield* Effect.try({
						try: () => {
							const txType = getTransactionType(tx);
							const toAddress =
								tx.to === undefined || tx.to === null
									? null
									: toAddressType(tx.to);
							const data = tx.data ? Hex.toBytes(tx.data) : new Uint8Array(0);
							const accessList = normalizeAccessList(tx.accessList);

							let signingTx: VoltaireTransaction.Any;

							switch (txType) {
								case 0: {
									const vValue = tx.chainId * 2n + 35n;
									signingTx = {
										type: VoltaireTransaction.Type.Legacy,
										nonce: tx.nonce,
										gasPrice: tx.gasPrice ?? 0n,
										gasLimit: tx.gasLimit,
										to: toAddress,
										value: tx.value ?? 0n,
										data,
										v: vValue,
										r: ZERO_SIGNATURE,
										s: ZERO_SIGNATURE,
									};
									break;
								}
								case 1: {
									signingTx = {
										type: VoltaireTransaction.Type.EIP2930,
										chainId: tx.chainId,
										nonce: tx.nonce,
										gasPrice: tx.gasPrice ?? 0n,
										gasLimit: tx.gasLimit,
										to: toAddress,
										value: tx.value ?? 0n,
										data,
										accessList,
										yParity: 0,
										r: ZERO_SIGNATURE,
										s: ZERO_SIGNATURE,
									};
									break;
								}
								case 2: {
									signingTx = {
										type: VoltaireTransaction.Type.EIP1559,
										chainId: tx.chainId,
										nonce: tx.nonce,
										maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? 0n,
										maxFeePerGas: tx.maxFeePerGas ?? 0n,
										gasLimit: tx.gasLimit,
										to: toAddress,
										value: tx.value ?? 0n,
										data,
										accessList,
										yParity: 0,
										r: ZERO_SIGNATURE,
										s: ZERO_SIGNATURE,
									};
									break;
								}
								case 3: {
									if (!toAddress) {
										throw new Error(
											"EIP-4844 transactions require a 'to' address",
										);
									}
									const blobVersionedHashes = (tx.blobVersionedHashes ?? []).map(
										(hash) => Hash.fromHex(hash),
									);
									signingTx = {
										type: VoltaireTransaction.Type.EIP4844,
										chainId: tx.chainId,
										nonce: tx.nonce,
										maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? 0n,
										maxFeePerGas: tx.maxFeePerGas ?? 0n,
										gasLimit: tx.gasLimit,
										to: toAddress,
										value: tx.value ?? 0n,
										data,
										accessList,
										maxFeePerBlobGas: tx.maxFeePerBlobGas ?? 0n,
										blobVersionedHashes,
										yParity: 0,
										r: ZERO_SIGNATURE,
										s: ZERO_SIGNATURE,
									};
									break;
								}
								case 4: {
									const authorizationList = normalizeAuthorizationList(
										tx.authorizationList,
									);
									signingTx = {
										type: VoltaireTransaction.Type.EIP7702,
										chainId: tx.chainId,
										nonce: tx.nonce,
										maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? 0n,
										maxFeePerGas: tx.maxFeePerGas ?? 0n,
										gasLimit: tx.gasLimit,
										to: toAddress,
										value: tx.value ?? 0n,
										data,
										accessList,
										authorizationList,
										yParity: 0,
										r: ZERO_SIGNATURE,
										s: ZERO_SIGNATURE,
									};
									break;
								}
							}

							return signingTx;
						},
						catch: toError,
					});

					const hash = yield* Effect.try({
						try: () => VoltaireTransaction.getSigningHash(signingTx),
						catch: toError,
					});
					const sig = yield* secp256k1.sign(
						hash as unknown as HashType,
						Redacted.value(redactedPrivateKey),
					);
					return toSignatureType(sig);
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
						Redacted.value(redactedPrivateKey),
					);
					return toSignatureType(sig);
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

			signAuthorization: (authorization) =>
				Effect.gen(function* () {
					const { unsigned, preimage } = yield* Effect.try({
						try: () => {
							const unsigned = toUnsignedAuthorization(authorization);
							// EIP-7702: hash = keccak256(0x05 || rlp([chainId, address, nonce]))
							const rlpItems: Uint8Array[] = [];

							// Encode chainId as RLP
							const chainIdBytes = bigintToBytes(unsigned.chainId);
							rlpItems.push(rlpEncodeItem(chainIdBytes));

							// Encode address (20 bytes)
							const addressBytes =
								typeof unsigned.address === "string"
									? Hex.toBytes(unsigned.address as HexType)
									: Address.toBytes(unsigned.address as AddressType);
							rlpItems.push(rlpEncodeItem(addressBytes));

							// Encode nonce as RLP
							const nonceBytes = bigintToBytes(unsigned.nonce);
							rlpItems.push(rlpEncodeItem(nonceBytes));

							// Create RLP list
							const rlpList = rlpEncodeList(rlpItems);

							// Prepend MAGIC byte 0x05
							const preimage = new Uint8Array(1 + rlpList.length);
							preimage[0] = 0x05;
							preimage.set(rlpList, 1);

							return { unsigned, preimage };
						},
						catch: toError,
					});

					// Hash and sign
					const hash = yield* keccak.hash(preimage);
					const sig = yield* secp256k1.sign(
						hash as unknown as HashType,
						Redacted.value(redactedPrivateKey),
					);
					const signature = toSignatureType(sig);
					const [yParity, rBytes, sBytes] = Signature.toTuple(signature);
					const r = Hex.fromBytes(rBytes);
					const s = Hex.fromBytes(sBytes);

					return {
						chainId: unsigned.chainId,
						address:
							typeof unsigned.address === "string"
								? unsigned.address
								: (Address.toHex(unsigned.address) as `0x${string}`),
						nonce: unsigned.nonce,
						yParity,
						r: r as `0x${string}`,
						s: s as `0x${string}`,
					};
				}).pipe(
					Effect.mapError(
						(e) =>
							new AccountError(
								{ action: "signAuthorization" },
								"Failed to sign authorization",
								{ cause: e instanceof Error ? e : undefined },
							),
					),
				),
		});
	});

export const createLocalAccount = (
	privateKeyHex: HexType,
	deps: {
		readonly secp256k1: Secp256k1ServiceShape;
		readonly keccak: KeccakServiceShape;
	},
) =>
	Effect.gen(function* () {
		const privateKey = createPrivateKeyState(privateKeyHex);
		return yield* buildLocalAccount(privateKey, deps.secp256k1, deps.keccak);
	});

export const LocalAccount = (privateKeyHex: HexType) =>
	Layer.scoped(
		AccountService,
		Effect.gen(function* () {
			const secp256k1 = yield* Secp256k1Service;
			const keccak = yield* KeccakService;

			const privateKey = yield* acquirePrivateKey(privateKeyHex);
			return yield* buildLocalAccount(privateKey, secp256k1, keccak);
		}),
	);

/**
 * Converts a bigint to minimal big-endian bytes (no leading zeros).
 * @internal
 */
function bigintToBytes(value: bigint): Uint8Array {
	if (value === 0n) return new Uint8Array(0);
	let hex = value.toString(16);
	if (hex.length % 2) hex = `0${hex}`;
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * RLP encodes a single item (bytes).
 * @internal
 */
function rlpEncodeItem(bytes: Uint8Array): Uint8Array {
	if (bytes.length === 0) {
		return new Uint8Array([0x80]);
	}
	if (bytes.length === 1 && bytes[0] < 0x80) {
		return bytes;
	}
	if (bytes.length <= 55) {
		const result = new Uint8Array(1 + bytes.length);
		result[0] = 0x80 + bytes.length;
		result.set(bytes, 1);
		return result;
	}
	const lenBytes = bigintToBytes(BigInt(bytes.length));
	const result = new Uint8Array(1 + lenBytes.length + bytes.length);
	result[0] = 0xb7 + lenBytes.length;
	result.set(lenBytes, 1);
	result.set(bytes, 1 + lenBytes.length);
	return result;
}

/**
 * RLP encodes a list of already-encoded items.
 * @internal
 */
function rlpEncodeList(items: Uint8Array[]): Uint8Array {
	const totalLen = items.reduce((sum, item) => sum + item.length, 0);
	if (totalLen <= 55) {
		const result = new Uint8Array(1 + totalLen);
		result[0] = 0xc0 + totalLen;
		let offset = 1;
		for (const item of items) {
			result.set(item, offset);
			offset += item.length;
		}
		return result;
	}
	const lenBytes = bigintToBytes(BigInt(totalLen));
	const result = new Uint8Array(1 + lenBytes.length + totalLen);
	result[0] = 0xf7 + lenBytes.length;
	result.set(lenBytes, 1);
	let offset = 1 + lenBytes.length;
	for (const item of items) {
		result.set(item, offset);
		offset += item.length;
	}
	return result;
}
