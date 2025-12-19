/**
 * WASM bindings for Ethereum primitives
 * Uses WebAssembly bindings to Zig implementation for browser compatibility
 */

// ============================================================================
// Primitives
// ============================================================================

// Address operations
import { Address as AddressClass } from "../primitives/Address/index.js";

// Keccak-256 hashing
import { Hash as HashClass, keccak256 as keccak256Fn, eip191HashMessage as eip191HashMessageFn } from "../crypto/keccak.wasm.js";

// Bytecode operations
import {
	analyzeJumpDestinations as analyzeJumpDestinationsFn,
	isBytecodeBoundary as isBytecodeBoundaryFn,
	isValidJumpDest as isValidJumpDestFn,
	validate as validateBytecodeFn,
} from "../primitives/Bytecode/Bytecode.wasm.js";

// Hash algorithms
import {
	sha256 as sha256Fn,
	ripemd160 as ripemd160Fn,
	blake2b as blake2bFn,
	solidityKeccak256 as solidityKeccak256Fn,
	soliditySha256 as soliditySha256Fn,
} from "../primitives/Hash/Hash.wasm.js";

// Hex utilities
import { hexToBytes as hexToBytesFn, bytesToHex as bytesToHexFn } from "../primitives/Hex/Hex.wasm.js";

// RLP encoding
import {
	encodeBytes as rlpEncodeBytesFn,
	encodeUint as rlpEncodeUintFn,
	encodeUintFromBigInt as rlpEncodeUintFromBigIntFn,
	toHex as rlpToHexFn,
	fromHex as rlpFromHexFn,
} from "../primitives/Rlp/Rlp.wasm.js";

// Transaction operations
import {
	TransactionType as TransactionTypeEnum,
	detectTransactionType as detectTransactionTypeFn,
} from "../primitives/Transaction/Transaction.wasm.js";

// U256 operations
import {
	u256FromHex as u256FromHexFn,
	u256ToHex as u256ToHexFn,
	u256FromBigInt as u256FromBigIntFn,
	u256ToBigInt as u256ToBigIntFn,
} from "../primitives/Uint/Uint256.wasm.js";

// Blob operations (EIP-4844)
import {
	fromDataWasm as blobFromDataFn,
	toDataWasm as blobToDataFn,
	isValidWasm as blobIsValidFn,
	calculateGasWasm as blobCalculateGasFn,
	estimateCountWasm as blobEstimateCountFn,
	calculateGasPriceWasm as blobCalculateGasPriceFn,
	calculateExcessGasWasm as blobCalculateExcessGasFn,
} from "../primitives/Blob/Blob.wasm.js";

// Access List operations (EIP-2930)
import {
	gasCostWasm as accessListGasCostFn,
	gasSavingsWasm as accessListGasSavingsFn,
	includesAddressWasm as accessListIncludesAddressFn,
	includesStorageKeyWasm as accessListIncludesStorageKeyFn,
} from "../primitives/AccessList/AccessList.wasm.js";

// ============================================================================
// Crypto
// ============================================================================

// Signature operations (secp256k1)
import {
	type ParsedSignature,
	secp256k1RecoverPubkey as secp256k1RecoverPubkeyFn,
	secp256k1RecoverAddress as secp256k1RecoverAddressFn,
	secp256k1PubkeyFromPrivate as secp256k1PubkeyFromPrivateFn,
	secp256k1ValidateSignature as secp256k1ValidateSignatureFn,
	signatureNormalize as signatureNormalizeFn,
	signatureIsCanonical as signatureIsCanonicalFn,
	signatureParse as signatureParseFn,
	signatureSerialize as signatureSerializeFn,
} from "../crypto/signature.wasm.js";

// Wallet key generation
import { generatePrivateKey as generatePrivateKeyFn, compressPublicKey as compressPublicKeyFn } from "../crypto/wallet.wasm.js";

// BLAKE2 hashing
import { Blake2Wasm } from "../crypto/Blake2/Blake2.wasm.js";

// SHA256 hashing
import { Sha256Wasm } from "../crypto/sha256.wasm.js";

// RIPEMD160 hashing
import { Ripemd160Wasm } from "../crypto/ripemd160.wasm.js";

// Secp256k1 full namespace
import { Secp256k1Wasm } from "../crypto/secp256k1.wasm.js";

// X25519 key exchange
import { X25519Wasm } from "../crypto/x25519.wasm.js";

// Ed25519 signatures
import { Ed25519Wasm } from "../crypto/ed25519.wasm.js";

// P256 (secp256r1) operations
import { P256Wasm } from "../crypto/p256.wasm.js";

// ============================================================================
// Named Exports
// ============================================================================

// Primitives
export { AddressClass as Address };
export { HashClass as Hash, keccak256Fn as keccak256, eip191HashMessageFn as eip191HashMessage };
export { analyzeJumpDestinationsFn as analyzeJumpDestinations, isBytecodeBoundaryFn as isBytecodeBoundary, isValidJumpDestFn as isValidJumpDest, validateBytecodeFn as validateBytecode };
export { sha256Fn as sha256, ripemd160Fn as ripemd160, blake2bFn as blake2b, solidityKeccak256Fn as solidityKeccak256, soliditySha256Fn as soliditySha256 };
export { hexToBytesFn as hexToBytes, bytesToHexFn as bytesToHex };
export { rlpEncodeBytesFn as rlpEncodeBytes, rlpEncodeUintFn as rlpEncodeUint, rlpEncodeUintFromBigIntFn as rlpEncodeUintFromBigInt, rlpToHexFn as rlpToHex, rlpFromHexFn as rlpFromHex };
export { TransactionTypeEnum as TransactionType, detectTransactionTypeFn as detectTransactionType };
export { u256FromHexFn as u256FromHex, u256ToHexFn as u256ToHex, u256FromBigIntFn as u256FromBigInt, u256ToBigIntFn as u256ToBigInt };
export { blobFromDataFn as blobFromData, blobToDataFn as blobToData, blobIsValidFn as blobIsValid, blobCalculateGasFn as blobCalculateGas, blobEstimateCountFn as blobEstimateCount, blobCalculateGasPriceFn as blobCalculateGasPrice, blobCalculateExcessGasFn as blobCalculateExcessGas };
export { accessListGasCostFn as accessListGasCost, accessListGasSavingsFn as accessListGasSavings, accessListIncludesAddressFn as accessListIncludesAddress, accessListIncludesStorageKeyFn as accessListIncludesStorageKey };

// Crypto
export { type ParsedSignature, secp256k1RecoverPubkeyFn as secp256k1RecoverPubkey, secp256k1RecoverAddressFn as secp256k1RecoverAddress, secp256k1PubkeyFromPrivateFn as secp256k1PubkeyFromPrivate, secp256k1ValidateSignatureFn as secp256k1ValidateSignature, signatureNormalizeFn as signatureNormalize, signatureIsCanonicalFn as signatureIsCanonical, signatureParseFn as signatureParse, signatureSerializeFn as signatureSerialize };
export { generatePrivateKeyFn as generatePrivateKey, compressPublicKeyFn as compressPublicKey };
export { Blake2Wasm, Sha256Wasm, Ripemd160Wasm, Secp256k1Wasm, X25519Wasm, Ed25519Wasm, P256Wasm };

// ============================================================================
// Default Export
// ============================================================================

export default {
	// Primitives
	Address: AddressClass,
	Hash: HashClass,
	keccak256: keccak256Fn,
	eip191HashMessage: eip191HashMessageFn,
	analyzeJumpDestinations: analyzeJumpDestinationsFn,
	isBytecodeBoundary: isBytecodeBoundaryFn,
	isValidJumpDest: isValidJumpDestFn,
	validateBytecode: validateBytecodeFn,
	sha256: sha256Fn,
	ripemd160: ripemd160Fn,
	blake2b: blake2bFn,
	solidityKeccak256: solidityKeccak256Fn,
	soliditySha256: soliditySha256Fn,
	hexToBytes: hexToBytesFn,
	bytesToHex: bytesToHexFn,
	rlpEncodeBytes: rlpEncodeBytesFn,
	rlpEncodeUint: rlpEncodeUintFn,
	rlpEncodeUintFromBigInt: rlpEncodeUintFromBigIntFn,
	rlpToHex: rlpToHexFn,
	rlpFromHex: rlpFromHexFn,
	TransactionType: TransactionTypeEnum,
	detectTransactionType: detectTransactionTypeFn,
	u256FromHex: u256FromHexFn,
	u256ToHex: u256ToHexFn,
	u256FromBigInt: u256FromBigIntFn,
	u256ToBigInt: u256ToBigIntFn,
	blobFromData: blobFromDataFn,
	blobToData: blobToDataFn,
	blobIsValid: blobIsValidFn,
	blobCalculateGas: blobCalculateGasFn,
	blobEstimateCount: blobEstimateCountFn,
	blobCalculateGasPrice: blobCalculateGasPriceFn,
	blobCalculateExcessGas: blobCalculateExcessGasFn,
	accessListGasCost: accessListGasCostFn,
	accessListGasSavings: accessListGasSavingsFn,
	accessListIncludesAddress: accessListIncludesAddressFn,
	accessListIncludesStorageKey: accessListIncludesStorageKeyFn,
	// Crypto
	secp256k1RecoverPubkey: secp256k1RecoverPubkeyFn,
	secp256k1RecoverAddress: secp256k1RecoverAddressFn,
	secp256k1PubkeyFromPrivate: secp256k1PubkeyFromPrivateFn,
	secp256k1ValidateSignature: secp256k1ValidateSignatureFn,
	signatureNormalize: signatureNormalizeFn,
	signatureIsCanonical: signatureIsCanonicalFn,
	signatureParse: signatureParseFn,
	signatureSerialize: signatureSerializeFn,
	generatePrivateKey: generatePrivateKeyFn,
	compressPublicKey: compressPublicKeyFn,
	// Full crypto namespaces
	Blake2: Blake2Wasm,
	Sha256: Sha256Wasm,
	Ripemd160: Ripemd160Wasm,
	Secp256k1: Secp256k1Wasm,
	X25519: X25519Wasm,
	Ed25519: Ed25519Wasm,
	P256: P256Wasm,
};
