import type { assert } from "./assert.js";
import type { HashType } from "./BrandedHash.js";
import type { clone } from "./clone.js";
import type { equals } from "./equals.js";
import type { format } from "./format.js";
import type { isHash } from "./isHash.js";
import type { isValidHex } from "./isValidHex.js";
import type { isZero } from "./isZero.js";
import type { Keccak256 } from "./keccak256.js";
import type { Keccak256Hex } from "./keccak256Hex.js";
import type { Keccak256String } from "./keccak256String.js";
import type { random } from "./random.js";
import type { slice } from "./slice.js";
import type { toBytes } from "./toBytes.js";
import type { toHex } from "./toHex.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the canonical name for this conversion
import type { toString } from "./toString.js";

type HashPrototype = HashType & {
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
	/** Canonical constructor. Creates a Hash from string or Uint8Array. */
	(value: string | Uint8Array): HashType;
	prototype: HashPrototype;
	ZERO: HashType;
	SIZE: number;
	/** @deprecated Alias for Hash(). Prefer using Hash() constructor directly. */
	from(value: string | Uint8Array): HashType;
	fromBytes(value: Uint8Array): HashType;
	fromHex(value: string): HashType;
	isHash: typeof isHash;
	isValidHex: typeof isValidHex;
	assert: typeof assert;
	keccak256: ReturnType<typeof Keccak256>;
	keccak256String: ReturnType<typeof Keccak256String>;
	keccak256Hex: ReturnType<typeof Keccak256Hex>;
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
