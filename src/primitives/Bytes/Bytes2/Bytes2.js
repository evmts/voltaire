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
 * @typedef {import('./Bytes2Type.js').Bytes2Type} Bytes2Type
 */

/**
 * Create Bytes2 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes2Type}
 */
export function Bytes2(value) {
	return from(value);
}

Bytes2.from = from;
Bytes2.fromHex = fromHex;
Bytes2.toHex = toHex;
Bytes2.toBytes = toBytes;
Bytes2.equals = equals;
Bytes2.compare = compare;
Bytes2.size = size;
Bytes2.clone = clone;
