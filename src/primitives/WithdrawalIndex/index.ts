export type { WithdrawalIndexType } from "./WithdrawalIndexType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt } from "./toBigInt.js";
import { toNumber } from "./toNumber.js";

export { from, toNumber, toBigInt, equals };

export const WithdrawalIndex = {
	from,
	toNumber,
	toBigInt,
	equals,
};
