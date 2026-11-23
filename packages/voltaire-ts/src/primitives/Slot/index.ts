export type { SlotType } from "./SlotType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt } from "./toBigInt.js";
import { toEpoch } from "./toEpoch.js";
import { toNumber } from "./toNumber.js";

export { equals, from, toBigInt, toEpoch, toNumber };

export const Slot = {
	from,
	toNumber,
	toBigInt,
	equals,
	toEpoch,
};
