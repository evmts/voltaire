export type { WithdrawalIndexType } from "./WithdrawalIndexType.js";

import { equals } from "./equals.js";
import { from, UINT64_MAX } from "./from.js";
import { toBigInt } from "./toBigInt.js";
import { toNumber } from "./toNumber.js";

export { from, toNumber, toBigInt, equals, UINT64_MAX };

export const WithdrawalIndex = {
	from,
	toNumber,
	toBigInt,
	equals,
	UINT64_MAX,
};
