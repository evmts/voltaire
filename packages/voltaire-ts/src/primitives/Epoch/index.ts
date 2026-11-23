export type { EpochType } from "./EpochType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt } from "./toBigInt.js";
import { toNumber } from "./toNumber.js";
import { toSlot } from "./toSlot.js";

export { equals, from, toBigInt, toNumber, toSlot };

export const Epoch = {
	from,
	toNumber,
	toBigInt,
	equals,
	toSlot,
};
