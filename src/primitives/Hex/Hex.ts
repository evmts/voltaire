import type { HexType, Sized } from "./HexType.js";
import * as HexFuncs from "./internal-index.js";

// Re-export errors
export * from "./errors.js";

// Re-export commonly used functions at module level for convenience
export const fromBytes = HexFuncs.fromBytes;
export const toBytes = HexFuncs.toBytes;

/**
 * Factory function for creating Hex instances (canonical constructor)
 *
 * @param value - Hex string or bytes
 * @returns Hex value
 * @example
 * ```ts
 * import { Hex } from '@voltaire/primitives/Hex';
 * const hex = Hex('0x1234');
 * ```
 */
export function Hex(value: string | Uint8Array): HexType {
	return HexFuncs.from(value);
}

/**
 * Alias for Hex() - creates a Hex instance from a value
 *
 * @deprecated Use Hex() directly instead
 */
Hex.from = (value: string | Uint8Array): HexType => HexFuncs.from(value);

Hex.fromBytes = (value: Uint8Array): HexType => HexFuncs.fromBytes(value);

Hex.fromNumber = (value: number, size?: number): HexType =>
	HexFuncs.fromNumber(value, size);

Hex.fromBigInt = (value: bigint, size?: number): HexType =>
	HexFuncs.fromBigInt(value, size);

Hex.fromString = (value: string): HexType => HexFuncs.fromString(value);

Hex.fromBoolean = (value: boolean): Sized<1> => HexFuncs.fromBoolean(value);

// Static utility methods
Hex.isHex = HexFuncs.isHex;
Hex.concat = HexFuncs.concat;
Hex.random = HexFuncs.random;
Hex.zero = HexFuncs.zero;
Hex.validate = HexFuncs.validate;
Hex.toBytes = HexFuncs.toBytes;
Hex.toNumber = HexFuncs.toNumber;
Hex.toBigInt = HexFuncs.toBigInt;
Hex.toString = HexFuncs.toString;
Hex.toBoolean = HexFuncs.toBoolean;
Hex.size = HexFuncs.size;
Hex.isSized = HexFuncs.isSized;
Hex.assertSize = HexFuncs.assertSize;
Hex.slice = HexFuncs.slice;
Hex.pad = HexFuncs.pad;
Hex.padRight = HexFuncs.padRight;
Hex.trim = HexFuncs.trim;
Hex.equals = HexFuncs.equals;
Hex.xor = HexFuncs.xor;
Hex.clone = HexFuncs.clone;

// Default export for dynamic imports
export default Hex;
