// Export Class API
export { Hash } from "./Hash.js";

// Direct imports from implementation files for proper type inference
import { Keccak256 as _Keccak256Factory } from "./keccak256.js";
import { Keccak256Hex as _Keccak256HexFactory } from "./keccak256Hex.js";
import { Keccak256String as _Keccak256StringFactory } from "./keccak256String.js";
import { MerkleRoot as _MerkleRootFactory } from "./merkleRoot.js";
import { Concat as _ConcatFactory } from "./concat.js";
import { hash as keccak256Impl } from "../../crypto/Keccak256/hash.js";

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
export const keccak256: (data: Uint8Array) => HashType = _Keccak256Factory({
	keccak256: keccak256Impl,
});
export const keccak256Hex: (hex: string) => HashType = _Keccak256HexFactory({
	keccak256: keccak256Impl,
});
export const keccak256String: (str: string) => HashType =
	_Keccak256StringFactory({ keccak256: keccak256Impl });
export const merkleRoot: (leaves: HashType[]) => HashType = _MerkleRootFactory({
	keccak256: keccak256Impl,
});
export const concat: (...hashes: HashType[]) => HashType = _ConcatFactory({
	keccak256: keccak256Impl,
});

// Non-crypto exports - direct from implementation files
export { from } from "./from.js";
export { fromBytes } from "./fromBytes.js";
export { fromHex } from "./fromHex.js";
export { isHash } from "./isHash.js";
export { isValidHex } from "./isValidHex.js";
export { assert } from "./assert.js";
export { random } from "./random.js";
export { toBytes } from "./toBytes.js";
export { toHex } from "./toHex.js";
export { toString } from "./toString.js";
export { equals } from "./equals.js";
export { isZero } from "./isZero.js";
export { clone } from "./clone.js";
export { slice } from "./slice.js";
export { format } from "./format.js";
export { ZERO, SIZE } from "./constants.js";

// Export type definitions
export type {
	HashType,
	HashType as HashTypeInterface,
	HashLike,
} from "./HashType.js";
