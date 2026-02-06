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
 * @typedef {import('./Bytes5Type.js').Bytes5Type} Bytes5Type
 */
/**
 * Create Bytes5 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes5Type}
 */
export function Bytes5(value) {
    return from(value);
}
Bytes5.from = from;
Bytes5.fromHex = fromHex;
Bytes5.toHex = toHex;
Bytes5.toBytes = toBytes;
Bytes5.equals = equals;
Bytes5.compare = compare;
Bytes5.size = size;
Bytes5.clone = clone;
