import * as Internal from "./Bytes.index.js";
import type { BytesType } from "./BytesType.js";
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
export declare function Bytes(value: Uint8Array | string | number[]): BytesType;
export declare namespace Bytes {
    var from: typeof Internal.from;
    var fromHex: typeof Internal.fromHex;
    var fromBigInt: typeof Internal.fromBigInt;
    var fromNumber: typeof Internal.fromNumber;
    var fromString: typeof Internal.fromString;
    var zero: typeof Internal.zero;
    var random: typeof Internal.random;
    var assert: typeof Internal.assert;
    var clone: typeof Internal.clone;
    var compare: typeof Internal.compare;
    var concat: typeof Internal.concat;
    var equals: typeof Internal.equals;
    var isBytes: typeof Internal.isBytes;
    var isEmpty: typeof Internal.isEmpty;
    var padLeft: typeof Internal.padLeft;
    var padRight: typeof Internal.padRight;
    var size: typeof Internal.size;
    var slice: typeof Internal.slice;
    var trimLeft: typeof Internal.trimLeft;
    var trimRight: typeof Internal.trimRight;
    var toBigInt: typeof Internal.toBigInt;
    var toHex: typeof Internal.toHex;
    var toNumber: typeof Internal.toNumber;
    var toString: typeof Internal.toString;
}
//# sourceMappingURL=Bytes.d.ts.map