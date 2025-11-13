// @ts-nocheck
export * from "./BrandedHash.js";

// Import crypto dependencies
import { hash as keccak256Impl } from "../../../crypto/Keccak256/hash.js";

import { assert } from "./assert.js";
import { clone } from "./clone.js";
import { Concat } from "./concat.js";
import { SIZE, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { format } from "./format.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isHash } from "./isHash.js";
import { isValidHex } from "./isValidHex.js";
import { isZero } from "./isZero.js";
import { Keccak256 } from "./keccak256.js";
import { Keccak256Hex } from "./keccak256Hex.js";
import { Keccak256String } from "./keccak256String.js";
import { MerkleRoot } from "./merkleRoot.js";
import { random } from "./random.js";
import { slice } from "./slice.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toString } from "./toString.js";

// Factory exports (tree-shakeable)
export { Keccak256, Keccak256Hex, Keccak256String, MerkleRoot, Concat };

// Wrapper exports (convenient, backward compat)
export const keccak256 = Keccak256({ keccak256: keccak256Impl });
export const keccak256Hex = Keccak256Hex({ keccak256: keccak256Impl });
export const keccak256String = Keccak256String({ keccak256: keccak256Impl });
export const merkleRoot = MerkleRoot({ keccak256: keccak256Impl });
export const concat = Concat({ keccak256: keccak256Impl });

// Export non-crypto functions
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
	SIZE,
	ZERO,
};

// Namespace export
export const BrandedHash = {
	from,
	fromBytes,
	fromHex,
	isHash,
	isValidHex,
	assert,
	keccak256,
	keccak256String,
	keccak256Hex,
	random,
	toBytes,
	toHex,
	toString,
	equals,
	isZero,
	clone,
	slice,
	format,
	concat,
	merkleRoot,
	SIZE,
	ZERO,
	// Factories
	Keccak256,
	Keccak256Hex,
	Keccak256String,
	MerkleRoot,
	Concat,
};
