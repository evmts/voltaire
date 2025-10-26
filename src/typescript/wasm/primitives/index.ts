/**
 * WASM bindings for Ethereum primitives
 * Uses WebAssembly bindings to Zig implementation for browser compatibility
 */

// Address operations
export { Address } from "./address.wasm.js";

// Keccak-256 hashing
export { Hash, keccak256, eip191HashMessage } from "./keccak.wasm.js";

// Bytecode operations
export {
	type JumpDestination,
	analyzeJumpDestinations,
	isBytecodeBoundary,
	isValidJumpDest,
	validateBytecode,
} from "./bytecode.wasm.js";

// Hash algorithms
export {
	sha256,
	ripemd160,
	blake2b,
	solidityKeccak256,
	soliditySha256,
} from "./hash.wasm.js";

// Hex utilities
export { hexToBytes, bytesToHex } from "./hex.wasm.js";

// RLP encoding
export {
	encodeBytes as rlpEncodeBytes,
	encodeUint as rlpEncodeUint,
	encodeUintFromBigInt as rlpEncodeUintFromBigInt,
	toHex as rlpToHex,
	fromHex as rlpFromHex,
} from "./rlp.wasm.js";

// Signature operations (secp256k1)
export {
	type ParsedSignature,
	secp256k1RecoverPubkey,
	secp256k1RecoverAddress,
	secp256k1PubkeyFromPrivate,
	secp256k1ValidateSignature,
	signatureNormalize,
	signatureIsCanonical,
	signatureParse,
	signatureSerialize,
} from "./signature.wasm.js";

// Transaction operations
export {
	TransactionType,
	detectTransactionType,
} from "./transaction.wasm.js";

// U256 operations
export {
	u256FromHex,
	u256ToHex,
	u256FromBigInt,
	u256ToBigInt,
} from "./uint256.wasm.js";

// Wallet key generation
export { generatePrivateKey, compressPublicKey } from "./wallet.wasm.js";

// Re-export everything as default
export default {
	Address,
	Hash,
	keccak256,
	eip191HashMessage,
	analyzeJumpDestinations,
	isBytecodeBoundary,
	isValidJumpDest,
	validateBytecode,
	sha256,
	ripemd160,
	blake2b,
	solidityKeccak256,
	soliditySha256,
	hexToBytes,
	bytesToHex,
	rlpEncodeBytes,
	rlpEncodeUint,
	rlpEncodeUintFromBigInt,
	rlpToHex,
	rlpFromHex,
	secp256k1RecoverPubkey,
	secp256k1RecoverAddress,
	secp256k1PubkeyFromPrivate,
	secp256k1ValidateSignature,
	signatureNormalize,
	signatureIsCanonical,
	signatureParse,
	signatureSerialize,
	TransactionType,
	detectTransactionType,
	u256FromHex,
	u256ToHex,
	u256FromBigInt,
	u256ToBigInt,
	generatePrivateKey,
	compressPublicKey,
};
