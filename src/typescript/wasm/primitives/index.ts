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

// RLP encoding
export {
	encodeBytes as rlpEncodeBytes,
	encodeUint as rlpEncodeUint,
	encodeUintFromBigInt as rlpEncodeUintFromBigInt,
	toHex as rlpToHex,
	fromHex as rlpFromHex,
} from "./rlp.wasm.js";

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
	rlpEncodeBytes,
	rlpEncodeUint,
	rlpEncodeUintFromBigInt,
	rlpToHex,
	rlpFromHex,
};
