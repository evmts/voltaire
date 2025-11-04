import type { BrandedHash } from "./BrandedHash.js";
import type { assert } from "./assert.js";
import type { clone } from "./clone.js";
import type { equals } from "./equals.js";
import type { format } from "./format.js";
import type { from } from "./from.js";
import type { fromBytes } from "./fromBytes.js";
import type { fromHex } from "./fromHex.js";
import type { isHash } from "./isHash.js";
import type { isValidHex } from "./isValidHex.js";
import type { isZero } from "./isZero.js";
import type { keccak256 } from "./keccak256.js";
import type { keccak256Hex } from "./keccak256Hex.js";
import type { keccak256String } from "./keccak256String.js";
import type { random } from "./random.js";
import type { slice } from "./slice.js";
import type { toBytes } from "./toBytes.js";
import type { toHex } from "./toHex.js";
import type { toString } from "./toString.js";

type HashPrototype = BrandedHash & {
	toBytes: typeof toBytes;
	toHex: typeof toHex;
	toString: typeof toString;
	equals: typeof equals;
	isZero: typeof isZero;
	clone: typeof clone;
	slice: typeof slice;
	format: typeof format;
};

export interface HashConstructor {
	(value: string | Uint8Array): BrandedHash;
	prototype: HashPrototype;
	ZERO: BrandedHash;
	SIZE: number;
	from(value: string | Uint8Array): BrandedHash;
	fromBytes(value: Uint8Array): BrandedHash;
	fromHex(value: string): BrandedHash;
	isHash: typeof isHash;
	isValidHex: typeof isValidHex;
	assert: typeof assert;
	keccak256: typeof keccak256;
	keccak256String: typeof keccak256String;
	keccak256Hex: typeof keccak256Hex;
	random: typeof random;
	toBytes: typeof toBytes;
	toHex: typeof toHex;
	toString: typeof toString;
	equals: typeof equals;
	isZero: typeof isZero;
	clone: typeof clone;
	slice: typeof slice;
	format: typeof format;
}
