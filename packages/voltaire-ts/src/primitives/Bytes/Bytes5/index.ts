export type { Bytes5Type } from "./Bytes5Type.js";

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

// Namespace export
export const BytesType5 = {
	from,
	fromHex,
	toHex,
	toBytes,
	equals,
	compare,
	size,
	clone,
};
