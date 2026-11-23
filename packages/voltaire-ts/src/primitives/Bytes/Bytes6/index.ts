export type { Bytes6Type } from "./Bytes6Type.js";

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
export const BytesType6 = {
	from,
	fromHex,
	toHex,
	toBytes,
	equals,
	compare,
	size,
	clone,
};
