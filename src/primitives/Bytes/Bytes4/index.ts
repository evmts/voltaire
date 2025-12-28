export type { Bytes4Type } from "./Bytes4Type.js";
import type { Bytes4Type } from "./Bytes4Type.js";

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
export function Bytes4(value: Uint8Array | string | number[]): Bytes4Type {
	if (Array.isArray(value)) {
		return from(new Uint8Array(value));
	}
	return from(value);
}

// Static methods
Bytes4.from = from;
Bytes4.fromHex = fromHex;
Bytes4.toHex = toHex;
Bytes4.toBytes = toBytes;
Bytes4.equals = equals;
Bytes4.compare = compare;
Bytes4.size = size;
Bytes4.clone = clone;
