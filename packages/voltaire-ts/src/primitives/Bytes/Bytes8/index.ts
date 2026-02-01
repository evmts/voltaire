export type { Bytes8Type } from "./Bytes8Type.js";

import type { Bytes8Type } from "./Bytes8Type.js";

import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { size } from "./size.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { from, fromHex, toHex, toBytes, equals, compare, size, clone };

// Callable constructor
export function Bytes8(value: Uint8Array | string | number[]): Bytes8Type {
	if (Array.isArray(value)) {
		return from(new Uint8Array(value));
	}
	return from(value);
}

// Static methods
Bytes8.from = from;
Bytes8.fromHex = fromHex;
Bytes8.toHex = toHex;
Bytes8.toBytes = toBytes;
Bytes8.equals = equals;
Bytes8.compare = compare;
Bytes8.size = size;
Bytes8.clone = clone;
