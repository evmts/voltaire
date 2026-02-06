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
 * @typedef {import('./Bytes3Type.js').Bytes3Type} Bytes3Type
 */
/**
 * Create Bytes3 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes3Type}
 */
export function Bytes3(value) {
    return from(value);
}
Bytes3.from = from;
Bytes3.fromHex = fromHex;
Bytes3.toHex = toHex;
Bytes3.toBytes = toBytes;
Bytes3.equals = equals;
Bytes3.compare = compare;
Bytes3.size = size;
Bytes3.clone = clone;
