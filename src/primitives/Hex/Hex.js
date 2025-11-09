// @ts-nocheck
import * as BrandedHex from "./BrandedHex/index.js";

// Re-export errors
export * from "./BrandedHex/errors.js";

// Re-export commonly used functions at module level for convenience
export const fromBytes = BrandedHex.fromBytes;
export const toBytes = BrandedHex.toBytes;

/**
 * Factory function for creating Hex instances
 */
export function Hex(value) {
	return BrandedHex.from(value);
}

// Static constructors
Hex.from = (value) => BrandedHex.from(value);

Hex.fromBytes = (value) => BrandedHex.fromBytes(value);

Hex.fromNumber = (value, size) => BrandedHex.fromNumber(value, size);

Hex.fromBigInt = (value, size) => BrandedHex.fromBigInt(value, size);

Hex.fromString = (value) => BrandedHex.fromString(value);

Hex.fromBoolean = (value) => BrandedHex.fromBoolean(value);

// Static utility methods
Hex.isHex = BrandedHex.isHex;
Hex.concat = BrandedHex.concat;
Hex.random = BrandedHex.random;
Hex.zero = BrandedHex.zero;
Hex.validate = BrandedHex.validate;
Hex.toBytes = BrandedHex.toBytes;
Hex.toNumber = BrandedHex.toNumber;
Hex.toBigInt = BrandedHex.toBigInt;
Hex.toString = BrandedHex.toString;
Hex.toBoolean = BrandedHex.toBoolean;
Hex.size = BrandedHex.size;
Hex.isSized = BrandedHex.isSized;
Hex.assertSize = BrandedHex.assertSize;
Hex.slice = BrandedHex.slice;
Hex.pad = BrandedHex.pad;
Hex.padRight = BrandedHex.padRight;
Hex.trim = BrandedHex.trim;
Hex.equals = BrandedHex.equals;
Hex.xor = BrandedHex.xor;
Hex.clone = BrandedHex.clone;

// Instance methods (Hex is a string, so no prototype chain like Address)
Hex.prototype.toBytes = Function.prototype.call.bind(BrandedHex.toBytes);
Hex.prototype.toNumber = Function.prototype.call.bind(BrandedHex.toNumber);
Hex.prototype.toBigInt = Function.prototype.call.bind(BrandedHex.toBigInt);
Hex.prototype.toString = Function.prototype.call.bind(BrandedHex.toString);
Hex.prototype.toBoolean = Function.prototype.call.bind(BrandedHex.toBoolean);
Hex.prototype.size = Function.prototype.call.bind(BrandedHex.size);
Hex.prototype.isSized = Function.prototype.call.bind(BrandedHex.isSized);
Hex.prototype.validate = Function.prototype.call.bind(BrandedHex.validate);
Hex.prototype.assertSize = Function.prototype.call.bind(BrandedHex.assertSize);
Hex.prototype.slice = Function.prototype.call.bind(BrandedHex.slice);
Hex.prototype.pad = Function.prototype.call.bind(BrandedHex.pad);
Hex.prototype.padRight = Function.prototype.call.bind(BrandedHex.padRight);
Hex.prototype.trim = Function.prototype.call.bind(BrandedHex.trim);
Hex.prototype.equals = Function.prototype.call.bind(BrandedHex.equals);
Hex.prototype.xor = Function.prototype.call.bind(BrandedHex.xor);
Hex.prototype.clone = Function.prototype.call.bind(BrandedHex.clone);
