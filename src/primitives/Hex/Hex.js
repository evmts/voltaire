// @ts-nocheck
import * as HexType from "./BrandedHex/index.js";

// Re-export errors
export * from "./BrandedHex/errors.js";

// Re-export commonly used functions at module level for convenience
export const fromBytes = HexType.fromBytes;
export const toBytes = HexType.toBytes;

/**
 * Factory function for creating Hex instances (canonical constructor)
 *
 * @example
 * ```ts
 * import { Hex } from '@voltaire/primitives/Hex';
 * const hex = Hex('0x1234');
 * ```
 */
export function Hex(value) {
	return HexType.from(value);
}

/**
 * Alias for Hex() - creates a Hex instance from a value
 *
 * @deprecated Use Hex() directly instead
 * @example
 * ```ts
 * import { Hex } from '@voltaire/primitives/Hex';
 * const hex = Hex('0x1234'); // Preferred
 * ```
 */
Hex.from = (value) => HexType.from(value);

Hex.fromBytes = (value) => HexType.fromBytes(value);

Hex.fromNumber = (value, size) => HexType.fromNumber(value, size);

Hex.fromBigInt = (value, size) => HexType.fromBigInt(value, size);

Hex.fromString = (value) => HexType.fromString(value);

Hex.fromBoolean = (value) => HexType.fromBoolean(value);

// Static utility methods
Hex.isHex = HexType.isHex;
Hex.concat = HexType.concat;
Hex.random = HexType.random;
Hex.zero = HexType.zero;
Hex.validate = HexType.validate;
Hex.toBytes = HexType.toBytes;
Hex.toNumber = HexType.toNumber;
Hex.toBigInt = HexType.toBigInt;
Hex.toString = HexType.toString;
Hex.toBoolean = HexType.toBoolean;
Hex.size = HexType.size;
Hex.isSized = HexType.isSized;
Hex.assertSize = HexType.assertSize;
Hex.slice = HexType.slice;
Hex.pad = HexType.pad;
Hex.padRight = HexType.padRight;
Hex.trim = HexType.trim;
Hex.equals = HexType.equals;
Hex.xor = HexType.xor;
Hex.clone = HexType.clone;

// Instance methods (Hex is a string, so no prototype chain like Address)
Hex.prototype.toBytes = Function.prototype.call.bind(HexType.toBytes);
Hex.prototype.toNumber = Function.prototype.call.bind(HexType.toNumber);
Hex.prototype.toBigInt = Function.prototype.call.bind(HexType.toBigInt);
Hex.prototype.toString = Function.prototype.call.bind(HexType.toString);
Hex.prototype.toBoolean = Function.prototype.call.bind(HexType.toBoolean);
Hex.prototype.size = Function.prototype.call.bind(HexType.size);
Hex.prototype.isSized = Function.prototype.call.bind(HexType.isSized);
Hex.prototype.validate = Function.prototype.call.bind(HexType.validate);
Hex.prototype.assertSize = Function.prototype.call.bind(HexType.assertSize);
Hex.prototype.slice = Function.prototype.call.bind(HexType.slice);
Hex.prototype.pad = Function.prototype.call.bind(HexType.pad);
Hex.prototype.padRight = Function.prototype.call.bind(HexType.padRight);
Hex.prototype.trim = Function.prototype.call.bind(HexType.trim);
Hex.prototype.equals = Function.prototype.call.bind(HexType.equals);
Hex.prototype.xor = Function.prototype.call.bind(HexType.xor);
Hex.prototype.clone = Function.prototype.call.bind(HexType.clone);
