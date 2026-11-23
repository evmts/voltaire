export type { Bytes3Type } from "./Bytes3Type.js";

import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { size } from "./size.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { clone, compare, equals, from, fromHex, size, toBytes, toHex };

// Namespace export
export const BytesType3 = {
	from,
	fromHex,
	toHex,
	toBytes,
	equals,
	compare,
	size,
	clone,
};
