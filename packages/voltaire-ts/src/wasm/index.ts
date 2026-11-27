/**
 * WASM entrypoint for Voltaire (`@tevm/voltaire/wasm`)
 *
 * Provides the exact same API as the main JS entrypoint (`src/index.ts`), with
 * primary crypto methods backed by Zig WebAssembly (`primitives.wasm`).
 *
 * - **Node.js / Bun**: auto-initializes synchronously on first WASM call (zero `await` boilerplate).
 * - **Browsers**: call `await initWasm()` before invoking WASM methods (calling before init
 *   throws `WasmNotInitializedError`).
 *
 * @example
 * ```typescript
 * import { initWasm, Keccak256, Secp256k1 } from '@tevm/voltaire/wasm';
 *
 * // Required in browsers; optional in Node/Bun (auto-inits synchronously)
 * await initWasm();
 *
 * const hash = Keccak256.hash(data);
 * const sig = Secp256k1.sign(hash, privateKey);
 * ```
 */

import type { VoltaireAPI } from "../api-interface.js";
import type { Blake2Hash as Blake2HashType } from "../crypto/Blake2/Blake2HashType.js";
import { Blake2Wasm } from "../crypto/Blake2/Blake2.wasm.js";
import { Blake2InvalidOutputLengthError } from "../crypto/Blake2/errors.js";
import { Blake2 as Blake2JS } from "../crypto/Blake2/index.js";
import { Bls12381 as Bls12381JS } from "../crypto/Bls12381/Bls12381.js";
import { BN254 as BN254JS } from "../crypto/bn254/BN254.js";
import { Bn254Wasm } from "../crypto/bn254.wasm.js";
import { constantTimeEqual } from "../crypto/ConstantTime/constantTimeEqual.js";
import { constantTimeIsZero } from "../crypto/ConstantTime/constantTimeIsZero.js";
import {
	Ed25519Error,
	InvalidPublicKeyError as Ed25519InvalidPublicKeyError,
	InvalidSecretKeyError as Ed25519InvalidSecretKeyError,
	InvalidSeedError as Ed25519InvalidSeedError,
	InvalidSignatureError as Ed25519InvalidSignatureError,
} from "../crypto/Ed25519/errors.js";
import { Ed25519 as Ed25519JS } from "../crypto/Ed25519/index.js";
import type { PublicKey as Ed25519PublicKey } from "../crypto/Ed25519/PublicKey.js";
import type { SecretKey as Ed25519SecretKey } from "../crypto/Ed25519/SecretKey.js";
import type { Seed as Ed25519Seed } from "../crypto/Ed25519/Seed.js";
import type { Signature as Ed25519Signature } from "../crypto/Ed25519/Signature.js";
import { Ed25519Wasm } from "../crypto/ed25519.wasm.js";
import type {
	Message as Eip712Message,
	Signature as Eip712Signature,
	TypeDefinitions as Eip712TypeDefinitions,
	TypedData as Eip712TypedData,
} from "../crypto/EIP712/EIP712Type.js";
import { EIP712 as EIP712JS } from "../crypto/EIP712/index.js";
import { Eip712Wasm } from "../crypto/eip712.wasm.js";
import {
	eip191HashMessage,
	Hash as KeccakHash,
	keccak256 as wasmKeccak256,
} from "../crypto/keccak.wasm.js";
import { Keccak256 as Keccak256JS } from "../crypto/Keccak256/index.js";
import type { Keccak256Hash as Keccak256HashType } from "../crypto/Keccak256/Keccak256HashType.js";
import { Keccak256Wasm } from "../crypto/keccak256.wasm.js";
import { KZG as KZGJS } from "../crypto/KZG/index.js";
import { ModExp as ModExpJS } from "../crypto/ModExp/index.js";
import {
	InvalidPrivateKeyError as P256InvalidPrivateKeyError,
	InvalidPublicKeyError as P256InvalidPublicKeyError,
	P256Error,
} from "../crypto/P256/errors.js";
import { P256 as P256JS } from "../crypto/P256/index.js";
import type { P256PrivateKeyType } from "../crypto/P256/P256PrivateKeyType.js";
import type { P256PublicKeyType } from "../crypto/P256/P256PublicKeyType.js";
import type { P256SignatureType } from "../crypto/P256/P256SignatureType.js";
import { P256Wasm } from "../crypto/p256.wasm.js";
import { Ripemd160 as Ripemd160JS } from "../crypto/Ripemd160/index.js";
import type { Ripemd160Hash as Ripemd160HashType } from "../crypto/Ripemd160/Ripemd160HashType.js";
import { Ripemd160Wasm } from "../crypto/ripemd160.wasm.js";
import {
	Secp256k1 as Secp256k1JS,
	Secp256k1Error,
} from "../crypto/Secp256k1/index.js";
import type { Secp256k1PublicKeyType } from "../crypto/Secp256k1/Secp256k1PublicKeyType.js";
import type { Secp256k1SignatureType } from "../crypto/Secp256k1/SignatureType.js";
import { Secp256k1Wasm } from "../crypto/secp256k1.wasm.js";
import { SHA256 as SHA256JS } from "../crypto/SHA256/index.js";
import type { SHA256Hash as SHA256HashType } from "../crypto/SHA256/SHA256HashType.js";
import { Sha256Wasm } from "../crypto/sha256.wasm.js";
import {
	type ParsedSignature,
	secp256k1PubkeyFromPrivate,
	secp256k1RecoverAddress,
	secp256k1RecoverPubkey,
	secp256k1ValidateSignature,
	signatureIsCanonical,
	signatureNormalize,
	signatureParse,
	signatureSerialize,
} from "../crypto/signature.wasm.js";
import { compressPublicKey, generatePrivateKey } from "../crypto/wallet.wasm.js";
import {
	InvalidPublicKeyError as X25519InvalidPublicKeyError,
	InvalidSecretKeyError as X25519InvalidSecretKeyError,
	X25519Error,
} from "../crypto/X25519/errors.js";
import type { PublicKey as X25519PublicKey } from "../crypto/X25519/PublicKey.js";
import type { SecretKey as X25519SecretKey } from "../crypto/X25519/SecretKey.js";
import type { SharedSecret as X25519SharedSecret } from "../crypto/X25519/SharedSecret.js";
import { X25519 as X25519JS } from "../crypto/X25519/X25519.js";
import { X25519Wasm } from "../crypto/x25519.wasm.js";
import { Abi as AbiJS } from "../primitives/Abi/Abi.js";
import {
	gasCostWasm as accessListGasCost,
	gasSavingsWasm as accessListGasSavings,
	includesAddressWasm as accessListIncludesAddress,
	includesStorageKeyWasm as accessListIncludesStorageKey,
} from "../primitives/AccessList/AccessList.wasm.js";
import { AccessList as AccessListJS } from "../primitives/AccessList/index.js";
import { Address as AddressJS } from "../primitives/Address/index.js";
import {
	calculateExcessGasWasm as blobCalculateExcessGas,
	calculateGasPriceWasm as blobCalculateGasPrice,
	calculateGasWasm as blobCalculateGas,
	estimateBlobCountWasm as blobEstimateCount,
	fromDataWasm as blobFromData,
	isValidWasm as blobIsValid,
	toDataWasm as blobToData,
} from "../primitives/Blob/Blob.wasm.js";
import { Blob as BlobJS } from "../primitives/Blob/index.js";
import { BloomFilter as BloomFilterJS } from "../primitives/BloomFilter/index.js";
import {
	analyzeJumpDestinations,
	isBytecodeBoundary,
	isValidJumpDest,
	validate as validateBytecode,
} from "../primitives/Bytecode/Bytecode.wasm.js";
import { Bytecode as BytecodeJS } from "../primitives/Bytecode/index.js";
import { Bytes as BytesJS } from "../primitives/Bytes/Bytes.js";
import { Bytes32 as Bytes32JS } from "../primitives/Bytes/Bytes32/index.js";
import { Chain as ChainJS } from "../primitives/Chain/index.js";
import {
	Ether as EtherJS,
	Gwei as GweiJS,
	Wei as WeiJS,
} from "../primitives/Denomination/index.js";
import {
	CryptoError,
	InvalidFormatError,
	InvalidLengthError,
	InvalidPrivateKeyError,
	InvalidSignatureError,
} from "../primitives/errors/index.js";
import {
	blake2b as hashBlake2b,
	ripemd160 as hashRipemd160,
	sha256 as hashSha256,
	solidityKeccak256,
	soliditySha256,
} from "../primitives/Hash/Hash.wasm.js";
import { Hash as HashJS, type HashType } from "../primitives/Hash/index.js";
import {
	bytesToHex as wasmBytesToHex,
	hexToBytes as wasmHexToBytes,
} from "../primitives/Hex/Hex.wasm.js";
import { Hex as HexJS } from "../primitives/Hex/index.js";
import { parseHexByte } from "../primitives/Hex/parseHexByte.js";
import { Opcode as OpcodeJS } from "../primitives/Opcode/index.js";
import { from as privateKeyFrom } from "../primitives/PrivateKey/from.js";
import type { PrivateKeyType } from "../primitives/PrivateKey/PrivateKeyType.js";
import { encodeList } from "../primitives/Rlp/encodeList.js";
import { Rlp as RlpJS } from "../primitives/Rlp/index.js";
import {
	encodeBytes as rlpEncodeBytes,
	encodeUint as rlpEncodeUint,
	encodeUintFromBigInt as rlpEncodeUintFromBigInt,
	fromHex as rlpFromHex,
	toHex as rlpToHex,
} from "../primitives/Rlp/Rlp.wasm.js";
import { Siwe as SiweJS } from "../primitives/Siwe/index.js";
import { StorageKey as StorageKeyJS } from "../primitives/State/index.js";
import {
	detectTransactionType,
	TransactionType,
} from "../primitives/Transaction/Transaction.wasm.js";
import { Uint as UintJS } from "../primitives/Uint/Uint.js";
import {
	u256FromBigInt,
	u256FromHex,
	u256ToBigInt,
	u256ToHex,
} from "../primitives/Uint/Uint256.wasm.js";
import * as loader from "../wasm-loader/loader.js";
import {
	isWasmLoaded,
	kzgFreeTrustedSetup,
	kzgIsInitialized,
	kzgLoadTrustedSetupBytes,
	unloadWasm,
	type WasmInput,
	WasmNotInitializedError,
} from "../wasm-loader/loader.js";

// ============================================================================
// WASM Initialization Lifecycle Exports
// ============================================================================

/**
 * Initialize the Voltaire WASM runtime asynchronously (`primitives.wasm`).
 * Required before calling WASM methods in browser environments; optional in Node/Bun.
 */
export async function initWasm(wasmInput?: WasmInput): Promise<void> {
	await loader.loadWasm(wasmInput);
}

/**
 * Initialize the Voltaire WASM runtime synchronously (`primitives.wasm`).
 * Supported in Node.js/Bun (reads local file synchronously) or anywhere with raw bytes.
 */
export function initWasmSync(wasmInput?: WasmInput): void {
	loader.loadWasmSync(wasmInput);
}

export {
	isWasmLoaded,
	kzgFreeTrustedSetup,
	kzgIsInitialized,
	kzgLoadTrustedSetupBytes,
	unloadWasm,
	type WasmInput,
	WasmNotInitializedError,
};

// ============================================================================
// Shared Helpers
// ============================================================================

const utf8Encoder = new TextEncoder();
const MAX_U64 = 0xffffffffffffffffn;

function decodeHexStrict(hex: string, docsPath: string): Uint8Array {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]*$/.test(normalized)) {
		throw new InvalidFormatError("Invalid hex string", {
			code: -32602,
			value: hex,
			expected: "Hex string (0-9, a-f, A-F)",
			docsPath,
		});
	}
	if (normalized.length % 2 !== 0) {
		throw new InvalidFormatError("Hex string must have even length", {
			code: -32602,
			value: hex,
			expected: "Even number of hex characters",
			docsPath,
		});
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(normalized, i * 2);
	}
	return bytes;
}

function decodeHexSimple(hex: string): Uint8Array {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(normalized, i * 2);
	}
	return bytes;
}

function nonceToBytes(nonce: bigint): Uint8Array {
	if (nonce === 0n) return new Uint8Array(0);
	const hex = nonce.toString(16);
	const padded = hex.length % 2 ? `0${hex}` : hex;
	const bytes = new Uint8Array(padded.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(padded, i * 2);
	}
	return bytes;
}

// ============================================================================
// Keccak256 (Zig WASM-backed)
// ============================================================================

function keccakHash(data: Uint8Array): Keccak256HashType {
	loader.ensureWasmLoaded();
	return loader.keccak256(data) as unknown as Keccak256HashType;
}

function keccakHashString(str: string): Keccak256HashType {
	return keccakHash(utf8Encoder.encode(str));
}

function keccakHashHex(hex: string): Keccak256HashType {
	return keccakHash(
		decodeHexStrict(hex, "/crypto/keccak256/hash-hex#error-handling"),
	);
}

function keccakFrom(input: Uint8Array | string): Keccak256HashType {
	if (input instanceof Uint8Array) return keccakHash(input);
	if (typeof input === "string") {
		if (input.startsWith("0x") || /^[0-9a-fA-F]*$/.test(input)) {
			return keccakHashHex(input);
		}
		return keccakHashString(input);
	}
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}

function keccakHashMultiple(chunks: readonly Uint8Array[]): Keccak256HashType {
	let totalLength = 0;
	for (const chunk of chunks) totalLength += chunk.length;
	const combined = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.length;
	}
	return keccakHash(combined);
}

function keccakSelector(signature: string): Uint8Array {
	return keccakHashString(signature).slice(0, 4);
}

function keccakTopic(signature: string): Keccak256HashType {
	return keccakHashString(signature);
}

function keccakContractAddress(sender: Uint8Array, nonce: bigint): Uint8Array {
	if (sender.length !== 20) {
		throw new InvalidLengthError("Sender must be 20 bytes", {
			code: -32602,
			value: sender,
			expected: "20 bytes",
			context: { length: sender.length, nonce },
			docsPath: "/crypto/keccak256/contract-address#error-handling",
		});
	}
	if (nonce >= 0n && nonce <= MAX_U64) {
		loader.ensureWasmLoaded();
		return loader.calculateCreateAddress(sender, nonce);
	}
	return keccakHash(encodeList([sender, nonceToBytes(nonce)])).slice(12);
}

function keccakCreate2Address(
	sender: Uint8Array,
	salt: Uint8Array,
	initCodeHash: Uint8Array,
): Uint8Array {
	if (sender.length !== 20) {
		throw new InvalidLengthError("Sender must be 20 bytes", {
			code: -32602,
			value: sender,
			expected: "20 bytes",
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	if (salt.length !== 32) {
		throw new InvalidLengthError("Salt must be 32 bytes", {
			code: -32602,
			value: salt,
			expected: "32 bytes",
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	if (initCodeHash.length !== 32) {
		throw new InvalidLengthError("Init code hash must be 32 bytes", {
			code: -32602,
			value: initCodeHash,
			expected: "32 bytes",
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	const data = new Uint8Array(85);
	data[0] = 0xff;
	data.set(sender, 1);
	data.set(salt, 21);
	data.set(initCodeHash, 53);
	return keccakHash(data).slice(12);
}

/**
 * Keccak256 backed by Zig WASM (`primitives.wasm`).
 */
export const Keccak256 = Object.assign(keccakFrom, {
	from: keccakFrom,
	fromString: keccakHashString,
	fromHex: keccakHashHex,
	fromTopic: keccakTopic,
	hash: keccakHash,
	hashString: keccakHashString,
	hashHex: keccakHashHex,
	hashMultiple: keccakHashMultiple,
	selector: keccakSelector,
	topic: keccakTopic,
	contractAddress: keccakContractAddress,
	create2Address: keccakCreate2Address,
	DIGEST_SIZE: Keccak256JS.DIGEST_SIZE,
	RATE: Keccak256JS.RATE,
	STATE_SIZE: Keccak256JS.STATE_SIZE,
	_wasm: Keccak256Wasm,
});

// ============================================================================
// SHA256 (Zig WASM-backed)
// ============================================================================

function sha256Hash(data: Uint8Array): SHA256HashType {
	loader.ensureWasmLoaded();
	return loader.sha256(data) as SHA256HashType;
}

function sha256HashString(str: string): SHA256HashType {
	return sha256Hash(utf8Encoder.encode(str));
}

function sha256HashHex(hex: string): SHA256HashType {
	return sha256Hash(decodeHexSimple(hex));
}

function sha256From(input: Uint8Array | string): SHA256HashType {
	if (input instanceof Uint8Array) return sha256Hash(input);
	if (typeof input === "string") {
		if (input.startsWith("0x") || /^[0-9a-fA-F]*$/.test(input)) {
			return sha256HashHex(input);
		}
		return sha256HashString(input);
	}
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}

function sha256Create(): {
	update: (data: Uint8Array) => void;
	digest: () => Uint8Array;
} {
	const chunks: Uint8Array[] = [];
	let totalLength = 0;
	return {
		update(data: Uint8Array): void {
			const copy = new Uint8Array(data.length);
			copy.set(data);
			chunks.push(copy);
			totalLength += copy.length;
		},
		digest(): Uint8Array {
			const combined = new Uint8Array(totalLength);
			let offset = 0;
			for (const chunk of chunks) {
				combined.set(chunk, offset);
				offset += chunk.length;
			}
			return sha256Hash(combined);
		},
	};
}

/**
 * SHA256 backed by Zig WASM (`primitives.wasm`).
 */
export const SHA256 = Object.assign(sha256From, {
	from: sha256From,
	fromString: sha256HashString,
	fromHex: sha256HashHex,
	hash: sha256Hash,
	hashString: sha256HashString,
	hashHex: sha256HashHex,
	toHex: SHA256JS.toHex,
	create: sha256Create,
	OUTPUT_SIZE: SHA256JS.OUTPUT_SIZE,
	BLOCK_SIZE: SHA256JS.BLOCK_SIZE,
	_wasm: Sha256Wasm,
});

// ============================================================================
// Blake2 (Zig WASM-backed)
// ============================================================================

function blake2Hash(
	data: Uint8Array | string,
	outputLength = 64,
): Blake2HashType {
	if (
		!Number.isInteger(outputLength) ||
		outputLength < 1 ||
		outputLength > 64
	) {
		throw new Blake2InvalidOutputLengthError(outputLength);
	}
	const input = typeof data === "string" ? utf8Encoder.encode(data) : data;
	loader.ensureWasmLoaded();
	return loader.blake2Hash(input, outputLength) as Blake2HashType;
}

function blake2HashString(str: string, outputLength = 64): Blake2HashType {
	return blake2Hash(str, outputLength);
}

function blake2From(
	input: Uint8Array | string,
	outputLength = 64,
): Blake2HashType {
	if (input instanceof Uint8Array) return blake2Hash(input, outputLength);
	if (typeof input === "string") return blake2HashString(input, outputLength);
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}

/**
 * Blake2b backed by Zig WASM (`primitives.wasm`).
 */
export const Blake2 = Object.assign(blake2From, {
	from: blake2From,
	fromString: blake2HashString,
	hash: blake2Hash,
	hashString: blake2HashString,
	SIZE: Blake2JS.SIZE,
	_wasm: Blake2Wasm,
});

// ============================================================================
// Ripemd160 (Zig WASM-backed)
// ============================================================================

function ripemd160Hash(data: Uint8Array | string): Ripemd160HashType {
	const input = typeof data === "string" ? utf8Encoder.encode(data) : data;
	loader.ensureWasmLoaded();
	return loader.ripemd160(input) as Ripemd160HashType;
}

function ripemd160HashString(str: string): Ripemd160HashType {
	return ripemd160Hash(utf8Encoder.encode(str));
}

function ripemd160HashHex(hex: string): Ripemd160HashType {
	return ripemd160Hash(decodeHexSimple(hex));
}

function ripemd160From(input: Uint8Array | string): Ripemd160HashType {
	if (input instanceof Uint8Array) return ripemd160Hash(input);
	if (typeof input === "string") return ripemd160HashString(input);
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}

/**
 * Ripemd160 backed by Zig WASM (`primitives.wasm`).
 */
export const Ripemd160 = Object.assign(ripemd160From, {
	from: ripemd160From,
	fromString: ripemd160HashString,
	fromHex: ripemd160HashHex,
	hash: ripemd160Hash,
	hashString: ripemd160HashString,
	hashHex: ripemd160HashHex,
	SIZE: Ripemd160JS.SIZE,
	HEX_SIZE: Ripemd160JS.HEX_SIZE,
	_wasm: Ripemd160Wasm,
});

// ============================================================================
// Secp256k1 (Zig WASM-backed)
// ============================================================================

function validateSecpSigLengths(signature: {
	r: Uint8Array;
	s: Uint8Array;
}): void {
	if (signature.r.length !== Secp256k1JS.SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature r must be ${Secp256k1JS.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
			{
				code: "INVALID_SIGNATURE_R_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
	if (signature.s.length !== Secp256k1JS.SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature s must be ${Secp256k1JS.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
			{
				code: "INVALID_SIGNATURE_S_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
}

function secp256k1Sign(
	messageHash: HashType,
	privateKey: PrivateKeyType,
	options: { extraEntropy?: Uint8Array | boolean } = {},
): Secp256k1SignatureType {
	if (privateKey.length !== Secp256k1JS.PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError("Private key must be 32 bytes", {
			code: "PRIVATE_KEY_INVALID_LENGTH",
			docsPath: "/crypto/secp256k1/sign#error-handling",
		});
	}
	if (constantTimeIsZero(privateKey)) {
		throw new InvalidPrivateKeyError("Private key cannot be zero", {
			code: "PRIVATE_KEY_ZERO",
			docsPath: "/crypto/secp256k1/sign#error-handling",
		});
	}
	if (options.extraEntropy !== undefined) {
		return Secp256k1JS.sign(messageHash, privateKey, options);
	}
	loader.ensureWasmLoaded();
	const result = loader.secp256k1Sign(messageHash, privateKey);
	return {
		r: HashJS.from(result.r),
		s: HashJS.from(result.s),
		v: 27 + result.v,
	};
}

function secp256k1SignHash(
	hash: HashType,
	privateKey: PrivateKeyType,
): Secp256k1SignatureType {
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/sign-hash#error-handling",
		});
	}
	return secp256k1Sign(hash, privateKey);
}

function secp256k1Verify(
	signature: Secp256k1SignatureType,
	messageHash: HashType,
	publicKey: Secp256k1PublicKeyType,
): boolean {
	if (publicKey.length !== Secp256k1JS.PUBLIC_KEY_SIZE) {
		throw new InvalidSignatureError(
			`Public key must be ${Secp256k1JS.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			{
				code: "INVALID_PUBLIC_KEY_LENGTH",
				docsPath: "/crypto/secp256k1/verify#error-handling",
			},
		);
	}
	validateSecpSigLengths(signature);
	if (signature.v !== 27 && signature.v !== 28) {
		return false;
	}
	loader.ensureWasmLoaded();
	if (
		!loader.secp256k1Verify(messageHash, signature.r, signature.s, publicKey)
	) {
		return false;
	}
	try {
		const recovered = loader.secp256k1RecoverPubkey(
			messageHash,
			signature.r,
			signature.s,
			signature.v,
		);
		return constantTimeEqual(recovered, publicKey);
	} catch {
		return false;
	}
}

function secp256k1VerifyHash(
	signature: Secp256k1SignatureType,
	hash: HashType,
	publicKey: Secp256k1PublicKeyType,
): boolean {
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/verify-hash#error-handling",
		});
	}
	if (publicKey.length !== Secp256k1JS.PUBLIC_KEY_SIZE) {
		return false;
	}
	return secp256k1Verify(signature, hash, publicKey);
}

function secp256k1Recover(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	messageHash: HashType,
): Secp256k1PublicKeyType {
	validateSecpSigLengths(signature);
	let ethV: number;
	if (signature.v === 27 || signature.v === 28) {
		ethV = signature.v;
	} else if (signature.v === 0 || signature.v === 1) {
		ethV = signature.v + 27;
	} else {
		throw new InvalidSignatureError(
			`Invalid v value: ${signature.v} (expected 0, 1, 27, or 28)`,
			{
				code: "INVALID_SIGNATURE_V",
				context: { v: signature.v, expected: [0, 1, 27, 28] },
				docsPath: "/crypto/secp256k1/recover-public-key#error-handling",
			},
		);
	}
	loader.ensureWasmLoaded();
	try {
		return loader.secp256k1RecoverPubkey(
			messageHash,
			signature.r,
			signature.s,
			ethV,
		);
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new InvalidSignatureError(`Public key recovery failed: ${error}`, {
			code: "PUBLIC_KEY_RECOVERY_FAILED",
			context: { signature, messageHash },
			docsPath: "/crypto/secp256k1/recover-public-key#error-handling",
		});
	}
}

function secp256k1RecoverFromHash(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	hash: HashType,
): Secp256k1PublicKeyType {
	if (hash.length !== 32) {
		throw new CryptoError(`Hash must be exactly 32 bytes, got ${hash.length}`, {
			code: "INVALID_HASH_LENGTH",
			context: { hashLength: hash.length, expected: 32 },
			docsPath: "/crypto/secp256k1/recover-public-key-from-hash#error-handling",
		});
	}
	return secp256k1Recover(signature, hash);
}

function secp256k1Derive(privateKey: PrivateKeyType): Secp256k1PublicKeyType {
	if (privateKey.length !== Secp256k1JS.PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${Secp256k1JS.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
			{
				code: "INVALID_PRIVATE_KEY_LENGTH",
				docsPath: "/crypto/secp256k1/derive-public-key#error-handling",
			},
		);
	}
	loader.ensureWasmLoaded();
	try {
		return loader.secp256k1PubkeyFromPrivate(privateKey);
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new InvalidPrivateKeyError(`Key derivation failed: ${error}`, {
			code: "SECP256K1_KEY_DERIVATION_FAILED",
			docsPath: "/crypto/secp256k1/derive-public-key#error-handling",
		});
	}
}

function secp256k1IsValidSig(signature: Secp256k1SignatureType): boolean {
	if (
		signature.r.length !== Secp256k1JS.SIGNATURE_COMPONENT_SIZE ||
		signature.s.length !== Secp256k1JS.SIGNATURE_COMPONENT_SIZE
	) {
		return false;
	}
	if (
		signature.v !== 0 &&
		signature.v !== 1 &&
		signature.v !== 27 &&
		signature.v !== 28
	) {
		return false;
	}
	loader.ensureWasmLoaded();
	return loader.secp256k1ValidateSignature(signature.r, signature.s);
}

function secp256k1RandomPrivateKey(): Uint8Array {
	loader.ensureWasmLoaded();
	try {
		return loader.generatePrivateKey();
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new Secp256k1Error(`Failed to generate random private key: ${error}`, {
			code: -32000,
			docsPath: "/crypto/secp256k1/random-private-key#error-handling",
		});
	}
}

function secp256k1CreateKeyPair(): {
	privateKey: PrivateKeyType;
	publicKey: Secp256k1PublicKeyType;
} {
	const privateKey = secp256k1RandomPrivateKey() as PrivateKeyType;
	return { privateKey, publicKey: secp256k1Derive(privateKey) };
}

/**
 * Secp256k1 backed by Zig WASM (`primitives.wasm`).
 */
export const Secp256k1 = Object.assign({}, Secp256k1JS, {
	sign: secp256k1Sign,
	signHash: secp256k1SignHash,
	verify: secp256k1Verify,
	verifyHash: secp256k1VerifyHash,
	recoverPublicKey: secp256k1Recover,
	recoverPublicKeyFromHash: secp256k1RecoverFromHash,
	derivePublicKey: secp256k1Derive,
	isValidSignature: secp256k1IsValidSig,
	randomPrivateKey: secp256k1RandomPrivateKey,
	createKeyPair: secp256k1CreateKeyPair,
	_wasm: Secp256k1Wasm,
});

// ============================================================================
// Ed25519 (Zig WASM-backed)
// ============================================================================

function expandEd25519SecretKey(seed: Uint8Array): Uint8Array {
	const publicKey = Ed25519JS.derivePublicKey(seed as Ed25519SecretKey);
	const expanded = new Uint8Array(64);
	expanded.set(seed, 0);
	expanded.set(publicKey, 32);
	return expanded;
}

function ed25519Sign(
	message: Uint8Array,
	secretKey: Ed25519SecretKey,
): Ed25519Signature {
	if (secretKey.length !== Ed25519JS.SECRET_KEY_SIZE) {
		throw new Ed25519InvalidSecretKeyError(
			`Secret key must be ${Ed25519JS.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}
	const expanded = expandEd25519SecretKey(secretKey);
	try {
		loader.ensureWasmLoaded();
		return loader.ed25519Sign(message, expanded) as Ed25519Signature;
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new Ed25519Error(`Ed25519 signing failed: ${error}`);
	} finally {
		expanded.fill(0);
	}
}

function ed25519Verify(
	signature: Ed25519Signature,
	message: Uint8Array,
	publicKey: Ed25519PublicKey,
): boolean {
	if (publicKey.length !== Ed25519JS.PUBLIC_KEY_SIZE) {
		throw new Ed25519InvalidPublicKeyError(
			`Public key must be ${Ed25519JS.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
			{
				code: -32602,
				context: {
					length: publicKey.length,
					expected: Ed25519JS.PUBLIC_KEY_SIZE,
				},
				docsPath: "/crypto/ed25519/verify#error-handling",
			},
		);
	}
	if (signature.length !== Ed25519JS.SIGNATURE_SIZE) {
		throw new Ed25519InvalidSignatureError(
			`Signature must be ${Ed25519JS.SIGNATURE_SIZE} bytes, got ${signature.length}`,
			{
				code: -32602,
				context: {
					length: signature.length,
					expected: Ed25519JS.SIGNATURE_SIZE,
				},
				docsPath: "/crypto/ed25519/verify#error-handling",
			},
		);
	}
	loader.ensureWasmLoaded();
	return loader.ed25519Verify(message, signature, publicKey);
}

function ed25519DerivePublicKey(
	secretKey: Ed25519SecretKey,
): Ed25519PublicKey {
	if (secretKey.length !== Ed25519JS.SECRET_KEY_SIZE) {
		throw new Ed25519InvalidSecretKeyError(
			`Secret key must be ${Ed25519JS.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}
	const expanded = expandEd25519SecretKey(secretKey);
	try {
		loader.ensureWasmLoaded();
		return loader.ed25519DerivePublicKey(expanded) as Ed25519PublicKey;
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new Ed25519InvalidSecretKeyError(
			`Ed25519 key derivation failed: ${error}`,
		);
	} finally {
		expanded.fill(0);
	}
}

function ed25519KeypairFromSeed(seed: Ed25519Seed): {
	secretKey: Ed25519SecretKey;
	publicKey: Ed25519PublicKey;
} {
	if (seed.length !== Ed25519JS.SEED_SIZE) {
		throw new Ed25519InvalidSeedError(
			`Seed must be ${Ed25519JS.SEED_SIZE} bytes, got ${seed.length}`,
			{
				code: -32602,
				context: { length: seed.length, expected: Ed25519JS.SEED_SIZE },
				docsPath: "/crypto/ed25519/keypair-from-seed#error-handling",
			},
		);
	}
	const secretKey = seed as unknown as Ed25519SecretKey;
	return { secretKey, publicKey: ed25519DerivePublicKey(secretKey) };
}

/**
 * Ed25519 backed by Zig WASM (`primitives.wasm`).
 */
export const Ed25519 = Object.assign({}, Ed25519JS, {
	sign: ed25519Sign,
	verify: ed25519Verify,
	derivePublicKey: ed25519DerivePublicKey,
	keypairFromSeed: ed25519KeypairFromSeed,
	_wasm: Ed25519Wasm,
});

// ============================================================================
// P256 (Zig WASM-backed)
// ============================================================================

function p256Sign(
	messageHash: HashType | SHA256HashType | Uint8Array,
	privateKey: P256PrivateKeyType,
	options?: { extraEntropy?: boolean | Uint8Array; lowS?: boolean },
): P256SignatureType {
	if (privateKey.length !== P256JS.PRIVATE_KEY_SIZE) {
		throw new P256InvalidPrivateKeyError(
			`Private key must be ${P256JS.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}
	if (!P256JS.validatePrivateKey(privateKey)) {
		throw new P256InvalidPrivateKeyError(
			"Private key must be in range [1, n-1]",
		);
	}
	if (options?.extraEntropy !== undefined || options?.lowS === false) {
		return P256JS.sign(messageHash, privateKey, options);
	}
	if (messageHash.length !== 32) {
		throw new P256Error(
			`Message hash must be 32 bytes, got ${messageHash.length}`,
		);
	}
	loader.ensureWasmLoaded();
	const sig = loader.p256Sign(messageHash, privateKey);
	return {
		r: HashJS.from(sig.slice(0, 32)),
		s: HashJS.from(sig.slice(32, 64)),
	};
}

function p256Verify(
	signature: P256SignatureType,
	messageHash: HashType | SHA256HashType | Uint8Array,
	publicKey: P256PublicKeyType,
): boolean {
	if (publicKey.length !== P256JS.PUBLIC_KEY_SIZE) {
		throw new P256InvalidPublicKeyError(
			`Public key must be ${P256JS.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}
	if (
		messageHash.length !== 32 ||
		signature.r.length !== P256JS.SIGNATURE_COMPONENT_SIZE ||
		signature.s.length !== P256JS.SIGNATURE_COMPONENT_SIZE
	) {
		return false;
	}
	if (!P256JS.validatePublicKey(publicKey)) {
		return false;
	}
	const compactSig = new Uint8Array(64);
	compactSig.set(signature.r, 0);
	compactSig.set(signature.s, 32);
	loader.ensureWasmLoaded();
	return loader.p256Verify(messageHash, compactSig, publicKey);
}

function p256DerivePublicKey(
	privateKey: P256PrivateKeyType,
): P256PublicKeyType {
	if (privateKey.length !== P256JS.PRIVATE_KEY_SIZE) {
		throw new P256InvalidPrivateKeyError(
			`Private key must be ${P256JS.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}
	if (!P256JS.validatePrivateKey(privateKey)) {
		throw new P256InvalidPrivateKeyError(
			"Private key must be in range [1, n-1]",
		);
	}
	loader.ensureWasmLoaded();
	return loader.p256DerivePublicKey(privateKey) as P256PublicKeyType;
}

function p256Ecdh(
	privateKey: P256PrivateKeyType,
	publicKey: P256PublicKeyType,
): Uint8Array {
	if (privateKey.length !== P256JS.PRIVATE_KEY_SIZE) {
		throw new P256InvalidPrivateKeyError(
			`Private key must be ${P256JS.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}
	if (!P256JS.validatePrivateKey(privateKey)) {
		throw new P256InvalidPrivateKeyError(
			"Private key must be in range [1, n-1]",
		);
	}
	if (publicKey.length !== P256JS.PUBLIC_KEY_SIZE) {
		throw new P256InvalidPublicKeyError(
			`Public key must be ${P256JS.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}
	if (!P256JS.validatePublicKey(publicKey)) {
		throw new P256InvalidPublicKeyError(
			"Public key is not a valid point on the P256 curve",
		);
	}
	loader.ensureWasmLoaded();
	return loader.p256Ecdh(privateKey, publicKey);
}

/**
 * P256 backed by Zig WASM (`primitives.wasm`).
 */
export const P256 = Object.assign({}, P256JS, {
	sign: p256Sign,
	verify: p256Verify,
	derivePublicKey: p256DerivePublicKey,
	ecdh: p256Ecdh,
	_wasm: P256Wasm,
});

// ============================================================================
// X25519 (Zig WASM-backed)
// ============================================================================

function x25519DerivePublicKey(secretKey: X25519SecretKey): X25519PublicKey {
	if (secretKey.length !== X25519JS.SECRET_KEY_SIZE) {
		throw new X25519InvalidSecretKeyError(
			`Secret key must be ${X25519JS.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}
	loader.ensureWasmLoaded();
	try {
		return loader.x25519DerivePublicKey(secretKey) as X25519PublicKey;
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new X25519InvalidSecretKeyError(
			`X25519 public key derivation failed: ${error}`,
		);
	}
}

function x25519Scalarmult(
	secretKey: X25519SecretKey,
	publicKey: X25519PublicKey,
): X25519SharedSecret {
	if (secretKey.length !== X25519JS.SECRET_KEY_SIZE) {
		throw new X25519InvalidSecretKeyError(
			`Secret key must be ${X25519JS.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
		);
	}
	if (publicKey.length !== X25519JS.PUBLIC_KEY_SIZE) {
		throw new X25519InvalidPublicKeyError(
			`Public key must be ${X25519JS.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
		);
	}
	if (X25519JS.isWeakPublicKey(publicKey)) {
		throw new X25519InvalidPublicKeyError(
			"Public key is a low-order point (all-zero shared secret)",
		);
	}
	loader.ensureWasmLoaded();
	let shared: Uint8Array;
	try {
		shared = loader.x25519Scalarmult(secretKey, publicKey);
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new X25519Error(`X25519 scalar multiplication failed: ${error}`);
	}
	if (constantTimeIsZero(shared)) {
		throw new X25519InvalidPublicKeyError(
			"Shared secret is all zeros (low-order public key)",
		);
	}
	return shared as X25519SharedSecret;
}

function x25519KeypairFromSeed(seed: Uint8Array): {
	secretKey: X25519SecretKey;
	publicKey: X25519PublicKey;
} {
	if (seed.length !== X25519JS.SECRET_KEY_SIZE) {
		throw new X25519InvalidSecretKeyError(
			`Seed must be ${X25519JS.SECRET_KEY_SIZE} bytes, got ${seed.length}`,
		);
	}
	loader.ensureWasmLoaded();
	try {
		const kp = loader.x25519KeypairFromSeed(seed);
		return {
			secretKey: kp.secretKey as X25519SecretKey,
			publicKey: kp.publicKey as X25519PublicKey,
		};
	} catch (error) {
		if (error instanceof WasmNotInitializedError) throw error;
		throw new X25519Error(`X25519 keypair generation failed: ${error}`);
	}
}

function x25519GenerateKeypair(): {
	secretKey: X25519SecretKey;
	publicKey: X25519PublicKey;
} {
	const secretKey = X25519JS.generateSecretKey();
	return { secretKey, publicKey: x25519DerivePublicKey(secretKey) };
}

/**
 * X25519 backed by Zig WASM (`primitives.wasm`).
 */
export const X25519 = Object.assign({}, X25519JS, {
	derivePublicKey: x25519DerivePublicKey,
	scalarmult: x25519Scalarmult,
	keypairFromSeed: x25519KeypairFromSeed,
	generateKeypair: x25519GenerateKeypair,
	_wasm: X25519Wasm,
});

// ============================================================================
// BN254 (Zig BN254 is native-only; JS implementation with _wasm alias)
// ============================================================================

/**
 * BN254 namespace (BN254 Zig exports are native-only on wasm32).
 */
export const BN254 = Object.assign({}, BN254JS, {
	_wasm: Bn254Wasm,
});

// ============================================================================
// EIP712 (Zig WASM Keccak256 + Secp256k1 via EIP712 factories)
// ============================================================================

const eip712Keccak = (data: Uint8Array): HashType =>
	keccakHash(data) as unknown as HashType;

const eip712HashType = EIP712JS.HashType({ keccak256: eip712Keccak });
let eip712HashStructFn: (
	primaryType: string,
	data: Eip712Message,
	types: Eip712TypeDefinitions,
) => HashType;

const eip712EncodeValue = EIP712JS.EncodeValue({
	keccak256: eip712Keccak,
	hashStruct: (primaryType, data, types) =>
		eip712HashStructFn(primaryType, data, types),
});
const eip712EncodeData = EIP712JS.EncodeData({
	hashType: eip712HashType,
	encodeValue: eip712EncodeValue,
});
eip712HashStructFn = EIP712JS.HashStruct({
	keccak256: eip712Keccak,
	encodeData: eip712EncodeData,
});
const eip712HashDomain = EIP712JS.HashDomain({
	hashStruct: eip712HashStructFn,
});
const eip712HashTypedData = EIP712JS.HashTypedData({
	keccak256: eip712Keccak,
	hashDomain: eip712HashDomain,
	hashStruct: eip712HashStructFn,
});

const eip712RecoverAddress = EIP712JS.RecoverAddress({
	keccak256: eip712Keccak,
	hashTypedData: eip712HashTypedData,
	recoverPublicKey: (compactSig, hash, recoveryBit) =>
		secp256k1Recover(
			{
				r: compactSig.slice(0, 32),
				s: compactSig.slice(32, 64),
				v: recoveryBit,
			},
			hash as HashType,
		),
});

const eip712SignRaw = EIP712JS.SignTypedData({
	hashTypedData: eip712HashTypedData,
	sign: (hash, privateKey) =>
		secp256k1Sign(hash as HashType, privateKey as PrivateKeyType),
});

function eip712SignTypedData(
	typedData: Eip712TypedData,
	privateKey: string | Uint8Array,
): Eip712Signature {
	const keyBytes =
		typeof privateKey === "string" ? privateKeyFrom(privateKey) : privateKey;
	return eip712SignRaw(typedData, keyBytes);
}

const eip712VerifyTypedData = EIP712JS.VerifyTypedData({
	recoverAddress: eip712RecoverAddress,
});

/**
 * EIP712 backed by Zig WASM Keccak256 + Secp256k1 (`primitives.wasm`).
 */
export const EIP712 = Object.assign({}, EIP712JS, {
	Domain: {
		hash: eip712HashDomain,
	},
	hashType: eip712HashType,
	encodeValue: eip712EncodeValue,
	encodeData: eip712EncodeData,
	hashStruct: eip712HashStructFn,
	hashTypedData: eip712HashTypedData,
	signTypedData: eip712SignTypedData,
	recoverAddress: eip712RecoverAddress,
	verifyTypedData: eip712VerifyTypedData,
	_wasm: Eip712Wasm,
});

// ============================================================================
// Primitives (re-export JS - most don't have WASM implementations)
// ============================================================================

export const Address = AddressJS;
export const Hash = HashJS;
export const Hex = HexJS;
export const Uint = UintJS;
export const Rlp = RlpJS;
export const Abi = AbiJS;
export const Blob = BlobJS;
export const AccessList = AccessListJS;
export * as BlockAccessList from "../primitives/BlockAccessList/index.js";
export * as ExecutionPayloadBid from "../primitives/ExecutionPayloadBid/index.js";
export const Bytecode = BytecodeJS;
export const Chain = ChainJS;
export const Opcode = OpcodeJS;
export const BloomFilter = BloomFilterJS;
export const Siwe = SiweJS;
export const Bytes = BytesJS;
export const Bytes32 = Bytes32JS;
export const StorageKey = StorageKeyJS;
export const Wei = WeiJS;
export const Gwei = GweiJS;
export const Ether = EtherJS;

// Export primitive error types to align with JS/native entrypoints
export * from "../primitives/errors/index.js";

// Crypto without WASM (re-export JS)
export const Bls12381 = Bls12381JS;
export const KZG = KZGJS;
export const ModExp = ModExpJS;

// Additional crypto namespaces present in JS/native
// Note: HDWallet uses native FFI modules - import from @tevm/voltaire/native instead
// Import specific modules to avoid pulling in HDWallet via crypto/index.js
export { AesGcm } from "../crypto/AesGcm/AesGcm.js";
export { Bip39 } from "../crypto/Bip39/index.js";
export { ChaCha20Poly1305 } from "../crypto/ChaCha20Poly1305/ChaCha20Poly1305.js";
export { ConstantTime } from "../crypto/ConstantTime/index.js";
export * as Keystore from "../crypto/Keystore/index.js";

// ============================================================================
// Type assertion: ensure WASM exports match JS API 1:1
// ============================================================================

const _wasmApi = {
	// Primitives
	Address,
	Hash,
	Hex,
	Uint,
	Rlp,
	Abi,
	Blob,
	AccessList,
	Bytecode,
	Chain,
	Opcode,
	BloomFilter,
	Siwe,
	Bytes,
	Bytes32,
	StorageKey,
	Wei,
	Gwei,
	Ether,

	// Crypto (WASM-backed)
	Keccak256,
	SHA256,
	Blake2,
	Ripemd160,
	Secp256k1,
	Ed25519,
	P256,
	X25519,
	BN254,
	Bls12381,
	KZG,
	EIP712,
	ModExp,
} satisfies VoltaireAPI;

// Export the API object for programmatic access (parity with native)
export { _wasmApi as wasmAPI };

// ============================================================================
// Standards, EVM, and Precompiles (match JS/native entrypoints)
// ============================================================================

export * as evm from "../evm/index.js";
export * as precompiles from "../evm/precompiles/precompiles.js";
export * from "../standards/index.js";

// ============================================================================
// Backward-compatible exports (legacy flat API & explicit *Wasm namespaces)
// ============================================================================

export {
	Blake2Wasm,
	Bn254Wasm,
	Ed25519Wasm,
	Eip712Wasm,
	Keccak256Wasm,
	P256Wasm,
	Ripemd160Wasm,
	Secp256k1Wasm,
	Sha256Wasm,
	X25519Wasm,
};

export {
	accessListGasCost,
	accessListGasSavings,
	accessListIncludesAddress,
	accessListIncludesStorageKey,
	analyzeJumpDestinations,
	blobCalculateExcessGas,
	blobCalculateGas,
	blobCalculateGasPrice,
	blobEstimateCount,
	blobFromData,
	blobIsValid,
	blobToData,
	compressPublicKey,
	detectTransactionType,
	eip191HashMessage,
	generatePrivateKey,
	hashBlake2b as blake2b,
	hashRipemd160 as ripemd160,
	hashSha256 as sha256,
	isBytecodeBoundary,
	isValidJumpDest,
	KeccakHash,
	type ParsedSignature,
	rlpEncodeBytes,
	rlpEncodeUint,
	rlpEncodeUintFromBigInt,
	rlpFromHex,
	rlpToHex,
	secp256k1PubkeyFromPrivate,
	secp256k1RecoverAddress,
	secp256k1RecoverPubkey,
	secp256k1ValidateSignature,
	signatureIsCanonical,
	signatureNormalize,
	signatureParse,
	signatureSerialize,
	solidityKeccak256,
	soliditySha256,
	TransactionType,
	u256FromBigInt,
	u256FromHex,
	u256ToBigInt,
	u256ToHex,
	validateBytecode,
	wasmBytesToHex as bytesToHex,
	wasmHexToBytes as hexToBytes,
	wasmKeccak256 as keccak256,
};

// ============================================================================
// Streaming primitives (pure JS - same as main entrypoint)
// ============================================================================

export * as block from "../block/index.js";
export * as contract from "../contract/index.js";
export * as stream from "../stream/index.js";
export * as transaction from "../transaction/index.js";

// Note: No default export to stay consistent with JS/native entrypoints
