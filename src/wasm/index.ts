/**
 * WASM entrypoint for Voltaire
 *
 * Provides the same API as the main JS entrypoint (src/index.ts) but with
 * WASM-accelerated implementations where available.
 *
 * @example
 * ```typescript
 * import { Keccak256, Secp256k1, Address } from '@voltaire/wasm';
 *
 * // Same API as JS entrypoint
 * const hash = Keccak256.hash(data);
 * const sig = Secp256k1.sign(hash, privateKey);
 * ```
 */

import type { VoltaireAPI } from "../api-interface.js";

// ============================================================================
// Import JS namespaces (types and implementations)
// ============================================================================

// Primitives
import { Address as AddressJS } from "../primitives/Address/index.js";
import { Hash as HashJS } from "../primitives/Hash/index.js";
import { Hex as HexJS } from "../primitives/Hex/index.js";
import { Uint as UintJS } from "../primitives/Uint/Uint.js";
import { Rlp as RlpJS } from "../primitives/Rlp/index.js";
import { Abi as AbiJS } from "../primitives/Abi/Abi.js";
import { Blob as BlobJS } from "../primitives/Blob/index.js";
import { AccessList as AccessListJS } from "../primitives/AccessList/index.js";
import { Bytecode as BytecodeJS } from "../primitives/Bytecode/index.js";
import { Chain as ChainJS } from "../primitives/Chain/index.js";
import { Opcode as OpcodeJS } from "../primitives/Opcode/index.js";
import { BloomFilter as BloomFilterJS } from "../primitives/BloomFilter/index.js";
import { Siwe as SiweJS } from "../primitives/Siwe/index.js";
import { Bytes as BytesJS } from "../primitives/Bytes/Bytes.js";
import { Bytes32 as Bytes32JS } from "../primitives/Bytes/Bytes32/index.js";
import { StorageKey as StorageKeyJS } from "../primitives/State/index.js";
import {
	Wei as WeiJS,
	Gwei as GweiJS,
	Ether as EtherJS,
} from "../primitives/Denomination/index.js";

// Crypto
import { Keccak256 as Keccak256JS } from "../crypto/Keccak256/index.js";
import { SHA256 as SHA256JS } from "../crypto/SHA256/index.js";
import { Blake2 as Blake2JS } from "../crypto/Blake2/index.js";
import { Ripemd160 as Ripemd160JS } from "../crypto/Ripemd160/index.js";
import { Secp256k1 as Secp256k1JS } from "../crypto/Secp256k1/index.js";
import { Ed25519 as Ed25519JS } from "../crypto/Ed25519/index.js";
import { P256 as P256JS } from "../crypto/P256/index.js";
import { X25519 as X25519JS } from "../crypto/X25519/X25519.js";
import { BN254 as BN254JS } from "../crypto/bn254/BN254.js";
import { Bls12381 as Bls12381JS } from "../crypto/Bls12381/Bls12381.js";
import { KZG as KZGJS } from "../crypto/KZG/index.js";
import { EIP712 as EIP712JS } from "../crypto/EIP712/index.js";
import { ModExp as ModExpJS } from "../crypto/ModExp/index.js";

// ============================================================================
// Import WASM implementations
// ============================================================================

import { Keccak256Wasm } from "../crypto/keccak256.wasm.js";
import { Sha256Wasm } from "../crypto/sha256.wasm.js";
import { Blake2Wasm } from "../crypto/Blake2/Blake2.wasm.js";
import { Ripemd160Wasm } from "../crypto/ripemd160.wasm.js";
import { Secp256k1Wasm } from "../crypto/secp256k1.wasm.js";
import { Ed25519Wasm } from "../crypto/ed25519.wasm.js";
import { P256Wasm } from "../crypto/p256.wasm.js";
import { X25519Wasm } from "../crypto/x25519.wasm.js";
import { Bn254Wasm } from "../crypto/bn254.wasm.js";
import { Eip712Wasm } from "../crypto/eip712.wasm.js";

// Primitive WASM implementations
import {
	analyzeJumpDestinations,
	isBytecodeBoundary,
	isValidJumpDest,
	validate as validateBytecode,
} from "../primitives/Bytecode/Bytecode.wasm.js";
import {
	sha256 as hashSha256,
	ripemd160 as hashRipemd160,
	blake2b as hashBlake2b,
	solidityKeccak256,
	soliditySha256,
} from "../primitives/Hash/Hash.wasm.js";
import {
	hexToBytes as wasmHexToBytes,
	bytesToHex as wasmBytesToHex,
} from "../primitives/Hex/Hex.wasm.js";
import {
	encodeBytes as rlpEncodeBytes,
	encodeUint as rlpEncodeUint,
	encodeUintFromBigInt as rlpEncodeUintFromBigInt,
	toHex as rlpToHex,
	fromHex as rlpFromHex,
} from "../primitives/Rlp/Rlp.wasm.js";
import {
	TransactionType,
	detectTransactionType,
} from "../primitives/Transaction/Transaction.wasm.js";
import {
	u256FromHex,
	u256ToHex,
	u256FromBigInt,
	u256ToBigInt,
} from "../primitives/Uint/Uint256.wasm.js";
import {
	fromDataWasm as blobFromData,
	toDataWasm as blobToData,
	isValidWasm as blobIsValid,
	calculateGasWasm as blobCalculateGas,
	estimateBlobCountWasm as blobEstimateCount,
	calculateGasPriceWasm as blobCalculateGasPrice,
	calculateExcessGasWasm as blobCalculateExcessGas,
} from "../primitives/Blob/Blob.wasm.js";
import {
	gasCostWasm as accessListGasCost,
	gasSavingsWasm as accessListGasSavings,
	includesAddressWasm as accessListIncludesAddress,
	includesStorageKeyWasm as accessListIncludesStorageKey,
} from "../primitives/AccessList/AccessList.wasm.js";

// Crypto WASM implementations (signature operations)
import {
	type ParsedSignature,
	secp256k1RecoverPubkey,
	secp256k1RecoverAddress,
	secp256k1PubkeyFromPrivate,
	secp256k1ValidateSignature,
	signatureNormalize,
	signatureIsCanonical,
	signatureParse,
	signatureSerialize,
} from "../crypto/signature.wasm.js";
import {
	Hash as KeccakHash,
	keccak256 as wasmKeccak256,
	eip191HashMessage,
} from "../crypto/keccak.wasm.js";
import {
	generatePrivateKey,
	compressPublicKey,
} from "../crypto/wallet.wasm.js";

// ============================================================================
// Create WASM-enhanced namespaces
// ============================================================================

/**
 * Keccak256 with WASM acceleration
 * Falls back to JS implementation, but WASM methods available via `_wasm`
 */
export const Keccak256 = Object.assign({}, Keccak256JS, {
	// WASM-accelerated methods (require init)
	_wasm: Keccak256Wasm,
});

/**
 * SHA256 with WASM acceleration
 */
export const SHA256 = Object.assign({}, SHA256JS, {
	_wasm: Sha256Wasm,
});

/**
 * Blake2 with WASM acceleration
 */
export const Blake2 = Object.assign({}, Blake2JS, {
	_wasm: Blake2Wasm,
});

/**
 * Ripemd160 with WASM acceleration
 */
export const Ripemd160 = Object.assign({}, Ripemd160JS, {
	_wasm: Ripemd160Wasm,
});

/**
 * Secp256k1 with WASM acceleration
 */
export const Secp256k1 = Object.assign({}, Secp256k1JS, {
	_wasm: Secp256k1Wasm,
});

/**
 * Ed25519 with WASM acceleration
 */
export const Ed25519 = Object.assign({}, Ed25519JS, {
	_wasm: Ed25519Wasm,
});

/**
 * P256 with WASM acceleration
 */
export const P256 = Object.assign({}, P256JS, {
	_wasm: P256Wasm,
});

/**
 * X25519 with WASM acceleration
 */
export const X25519 = Object.assign({}, X25519JS, {
	_wasm: X25519Wasm,
});

/**
 * BN254 with WASM acceleration
 */
export const BN254 = Object.assign({}, BN254JS, {
	_wasm: Bn254Wasm,
});

/**
 * EIP712 with WASM acceleration
 */
export const EIP712 = Object.assign({}, EIP712JS, {
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
export { AesGcm, ChaCha20Poly1305, Bip39, HDWallet, Keystore } from "../crypto/index.js";

// ============================================================================
// Type assertion: ensure WASM exports match JS API
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

	// Crypto
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

export * from "../standards/index.js";
export * as evm from "../evm/index.js";
export * as precompiles from "../evm/precompiles/precompiles.js";

// ============================================================================
// Backward-compatible exports (legacy flat API)
// These are kept for users who import directly from wasm module
// ============================================================================

// Re-export WASM namespaces for advanced users
export {
	Keccak256Wasm,
	Sha256Wasm,
	Blake2Wasm,
	Ripemd160Wasm,
	Secp256k1Wasm,
	Ed25519Wasm,
	P256Wasm,
	X25519Wasm,
	Bn254Wasm,
	Eip712Wasm,
};

// Legacy flat exports (deprecated, use namespace pattern)
export {
	// Keccak/Hash
	KeccakHash,
	wasmKeccak256 as keccak256,
	eip191HashMessage,
	hashSha256 as sha256,
	hashRipemd160 as ripemd160,
	hashBlake2b as blake2b,
	solidityKeccak256,
	soliditySha256,

	// Hex utilities
	wasmHexToBytes as hexToBytes,
	wasmBytesToHex as bytesToHex,

	// RLP encoding
	rlpEncodeBytes,
	rlpEncodeUint,
	rlpEncodeUintFromBigInt,
	rlpToHex,
	rlpFromHex,

	// Transaction
	TransactionType,
	detectTransactionType,

	// U256
	u256FromHex,
	u256ToHex,
	u256FromBigInt,
	u256ToBigInt,

	// Blob (EIP-4844)
	blobFromData,
	blobToData,
	blobIsValid,
	blobCalculateGas,
	blobEstimateCount,
	blobCalculateGasPrice,
	blobCalculateExcessGas,

	// Access List (EIP-2930)
	accessListGasCost,
	accessListGasSavings,
	accessListIncludesAddress,
	accessListIncludesStorageKey,

	// Bytecode analysis
	analyzeJumpDestinations,
	isBytecodeBoundary,
	isValidJumpDest,
	validateBytecode,

	// Signature operations
	type ParsedSignature,
	secp256k1RecoverPubkey,
	secp256k1RecoverAddress,
	secp256k1PubkeyFromPrivate,
	secp256k1ValidateSignature,
	signatureNormalize,
	signatureIsCanonical,
	signatureParse,
	signatureSerialize,

	// Wallet operations
	generatePrivateKey,
	compressPublicKey,
};

// Note: No default export to stay consistent with JS/native entrypoints
