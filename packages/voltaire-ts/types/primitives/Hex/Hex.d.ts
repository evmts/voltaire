import type { HexType, Sized } from "./HexType.js";
import * as HexFuncs from "./internal-index.js";
export * from "./errors.js";
export declare const fromBytes: typeof HexFuncs.fromBytes;
export declare const toBytes: typeof HexFuncs.toBytes;
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
export declare function Hex(value: string | Uint8Array): HexType;
export declare namespace Hex {
    var from: (value: string | Uint8Array) => HexType;
    var fromBytes: (value: Uint8Array) => HexType;
    var fromNumber: (value: number, size?: number) => HexType;
    var fromBigInt: (value: bigint, size?: number) => HexType;
    var fromString: (value: string) => HexType;
    var fromBoolean: (value: boolean) => Sized<1>;
    var isHex: typeof HexFuncs.isHex;
    var concat: typeof HexFuncs.concat;
    var random: typeof HexFuncs.random;
    var zero: typeof HexFuncs.zero;
    var validate: typeof HexFuncs.validate;
    var toBytes: typeof HexFuncs.toBytes;
    var toNumber: typeof HexFuncs.toNumber;
    var toBigInt: typeof HexFuncs.toBigInt;
    var toString: typeof HexFuncs.toString;
    var toBoolean: typeof HexFuncs.toBoolean;
    var size: typeof HexFuncs.size;
    var isSized: typeof HexFuncs.isSized;
    var assertSize: typeof HexFuncs.assertSize;
    var slice: typeof HexFuncs.slice;
    var pad: typeof HexFuncs.pad;
    var padRight: typeof HexFuncs.padRight;
    var trim: typeof HexFuncs.trim;
    var equals: typeof HexFuncs.equals;
    var xor: typeof HexFuncs.xor;
    var clone: typeof HexFuncs.clone;
}
export default Hex;
//# sourceMappingURL=Hex.d.ts.map