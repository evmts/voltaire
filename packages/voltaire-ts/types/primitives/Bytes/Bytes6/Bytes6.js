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
 * @typedef {import('./Bytes6Type.js').Bytes6Type} Bytes6Type
 */
/**
 * Create Bytes6 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes6Type}
 */
export function Bytes6(value) {
    return from(value);
}
Bytes6.from = from;
Bytes6.fromHex = fromHex;
Bytes6.toHex = toHex;
Bytes6.toBytes = toBytes;
Bytes6.equals = equals;
Bytes6.compare = compare;
Bytes6.size = size;
Bytes6.clone = clone;
