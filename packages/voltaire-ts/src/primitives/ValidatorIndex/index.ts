export type { ValidatorIndexType } from "./ValidatorIndexType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { toNumber } from "./toNumber.js";

export { equals, from, toNumber };

export const ValidatorIndex = {
	from,
	toNumber,
	equals,
};
