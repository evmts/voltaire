// @ts-nocheck
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { size } from "./size.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
/**
 * @typedef {import('./Bytes7Type.js').Bytes7Type} Bytes7Type
 */
/**
 * Create Bytes7 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes7Type}
 */
export function Bytes7(value) {
    return from(value);
}
Bytes7.from = from;
Bytes7.fromHex = fromHex;
Bytes7.toHex = toHex;
Bytes7.toBytes = toBytes;
Bytes7.equals = equals;
Bytes7.compare = compare;
Bytes7.size = size;
Bytes7.clone = clone;
