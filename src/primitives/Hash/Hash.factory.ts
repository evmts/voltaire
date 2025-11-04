/**
 * Hash Types and Utilities
 *
 * 32-byte hash values with encoding/decoding and comparison utilities.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Hash } from './Hash.js';
 *
 * // Factory function
 * const hash = Hash('0x1234...');
 *
 * // Static methods
 * const hex = Hash.toHex(hash);
 * const same = Hash.equals(hash, other);
 *
 * // Instance methods
 * const hex2 = hash.toHex();
 * const same2 = hash.equals(other);
 * ```
 */

// Import types
import type { HashConstructor } from "./HashConstructor.js";

// Import constants
import { SIZE, ZERO } from "./BrandedHash.js";

// Import all method functions
import { assert } from "./assert.js";
import { clone } from "./clone.js";
import { equals } from "./equals.js";
import { format } from "./format.js";
import { from as fromValue } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isHash } from "./isHash.js";
import { isValidHex } from "./isValidHex.js";
import { isZero } from "./isZero.js";
import { keccak256 } from "./keccak256.js";
import { keccak256Hex } from "./keccak256Hex.js";
import { keccak256String } from "./keccak256String.js";
import { random } from "./random.js";
import { slice } from "./slice.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toString } from "./toString.js";

// Re-export types and constants
export * from "./BrandedHash.js";

// Re-export method functions for tree-shaking
export {
	assert,
	clone,
	equals,
	format,
	fromBytes,
	fromHex,
	fromValue as from,
	isHash,
	isValidHex,
	isZero,
	keccak256,
	keccak256Hex,
	keccak256String,
	random,
	slice,
	toBytes,
	toHex,
	toString,
};

/**
 * Factory function for creating Hash instances
 */
export const Hash = ((value: string | Uint8Array) => {
	return fromValue(value);
}) as BrandedHashConstructor;

// Initialize prototype
Hash.prototype = {} as any;

// Attach constants
Hash.ZERO = ZERO;
Hash.SIZE = SIZE;

// Attach static methods
Hash.from = fromValue;
Hash.fromBytes = fromBytes;
Hash.fromHex = fromHex;
Hash.isHash = isHash;
Hash.isValidHex = isValidHex;
Hash.assert = assert;
Hash.keccak256 = keccak256;
Hash.keccak256String = keccak256String;
Hash.keccak256Hex = keccak256Hex;
Hash.random = random;

// Static methods that operate on Hash values
Hash.toBytes = toBytes;
Hash.toHex = toHex;
Hash.toString = toString;
Hash.equals = equals;
Hash.isZero = isZero;
Hash.clone = clone;
Hash.slice = slice;
Hash.format = format;

// Bind prototype methods using Function.prototype.call.bind
Hash.prototype.toBytes = Function.prototype.call.bind(toBytes) as any;
Hash.prototype.toHex = Function.prototype.call.bind(toHex) as any;
Hash.prototype.toString = Function.prototype.call.bind(toString) as any;
Hash.prototype.equals = Function.prototype.call.bind(equals) as any;
Hash.prototype.isZero = Function.prototype.call.bind(isZero) as any;
Hash.prototype.clone = Function.prototype.call.bind(clone) as any;
Hash.prototype.slice = Function.prototype.call.bind(slice) as any;
Hash.prototype.format = Function.prototype.call.bind(format) as any;
