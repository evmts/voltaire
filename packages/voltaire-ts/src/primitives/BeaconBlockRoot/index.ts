export type { BeaconBlockRootType } from "./BeaconBlockRootType.js";
export { SIZE } from "./BeaconBlockRootType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";

export { equals, from, fromBytes, fromHex, toHex };

export const BeaconBlockRoot = {
	from,
	fromHex,
	fromBytes,
	toHex,
	equals,
};
