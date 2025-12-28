import type { BytesType } from "./BytesType.js";
import * as Internal from "./Bytes.index.js";

/**
 * Create Bytes from various input types (callable constructor)
 *
 * @param value - Uint8Array, hex string, UTF-8 string, or number array
 * @returns Bytes
 *
 * @example
 * ```typescript
 * import { Bytes } from '@tevm/voltaire';
 *
 * const b1 = Bytes([0x01, 0x02, 0x03]);
 * const b2 = Bytes(new Uint8Array([0x01, 0x02]));
 * const b3 = Bytes("0x1234");
 * ```
 */
export function Bytes(value: Uint8Array | string | number[]): BytesType {
	return Internal.from(value);
}

// Static constructors
Bytes.from = Internal.from;
Bytes.fromHex = Internal.fromHex;
Bytes.fromBigInt = Internal.fromBigInt;
Bytes.fromNumber = Internal.fromNumber;
Bytes.fromString = Internal.fromString;

// Static factory methods
Bytes.zero = Internal.zero;
Bytes.random = Internal.random;

// Static utility methods
Bytes.assert = Internal.assert;
Bytes.clone = Internal.clone;
Bytes.compare = Internal.compare;
Bytes.concat = Internal.concat;
Bytes.equals = Internal.equals;
Bytes.isBytes = Internal.isBytes;
Bytes.isEmpty = Internal.isEmpty;
Bytes.padLeft = Internal.padLeft;
Bytes.padRight = Internal.padRight;
Bytes.size = Internal.size;
Bytes.slice = Internal.slice;
Bytes.trimLeft = Internal.trimLeft;
Bytes.trimRight = Internal.trimRight;

// Conversion methods
Bytes.toBigInt = Internal.toBigInt;
Bytes.toHex = Internal.toHex;
Bytes.toNumber = Internal.toNumber;
Bytes.toString = Internal.toString;
