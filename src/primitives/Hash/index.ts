// Export Class API
export { Hash } from "./Hash.js";

// Export Namespace API (individual functions for tree-shaking)
// Re-export from .js file with explicit types for proper d.ts generation
import {
	Keccak256 as _Keccak256Factory,
	Keccak256Hex as _Keccak256HexFactory,
	Keccak256String as _Keccak256StringFactory,
	MerkleRoot as _MerkleRootFactory,
	Concat as _ConcatFactory,
	keccak256 as _keccak256,
	keccak256Hex as _keccak256Hex,
	keccak256String as _keccak256String,
	merkleRoot as _merkleRoot,
	concat as _concat,
	from,
	fromBytes,
	fromHex,
	isHash,
	isValidHex,
	assert,
	random,
	toBytes,
	toHex,
	toString,
	equals,
	isZero,
	clone,
	slice,
	format,
	ZERO,
} from "./BrandedHashIndex.js";
import type { HashType, HashLike } from "./HashType.js";

// Factory exports (internal, prefixed with _ to avoid collision with crypto/Keccak256)
export {
	_Keccak256Factory,
	_Keccak256HexFactory,
	_Keccak256StringFactory,
	_MerkleRootFactory,
	_ConcatFactory,
};

// Wrapper exports with proper types
export const keccak256: (data: Uint8Array) => HashType = _keccak256;
export const keccak256Hex: (hex: string) => HashType = _keccak256Hex;
export const keccak256String: (str: string) => HashType = _keccak256String;
export const merkleRoot: (leaves: HashType[]) => HashType = _merkleRoot;
export const concat: (...hashes: HashType[]) => HashType = _concat;

// Non-crypto exports
export {
	from,
	fromBytes,
	fromHex,
	isHash,
	isValidHex,
	assert,
	random,
	toBytes,
	toHex,
	toString,
	equals,
	isZero,
	clone,
	slice,
	format,
	ZERO,
};

// Export constants
export { SIZE } from "./HashType.js";

// Export type definitions
export type { HashType, HashType as HashTypeInterface, HashLike } from "./HashType.js";
