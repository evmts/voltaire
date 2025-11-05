import type { BrandedHash } from "./BrandedHash/BrandedHash.js";
import type { assert } from "./BrandedHash/assert.js";
import type { clone } from "./BrandedHash/clone.js";
import type { equals } from "./BrandedHash/equals.js";
import type { format } from "./BrandedHash/format.js";
import type { isHash } from "./BrandedHash/isHash.js";
import type { isValidHex } from "./BrandedHash/isValidHex.js";
import type { isZero } from "./BrandedHash/isZero.js";
import type { keccak256 } from "./BrandedHash/keccak256.js";
import type { keccak256Hex } from "./BrandedHash/keccak256Hex.js";
import type { keccak256String } from "./BrandedHash/keccak256String.js";
import type { random } from "./BrandedHash/random.js";
import type { slice } from "./BrandedHash/slice.js";
import type { toBytes } from "./BrandedHash/toBytes.js";
import type { toHex } from "./BrandedHash/toHex.js";
import type { toString } from "./BrandedHash/toString.js";

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
