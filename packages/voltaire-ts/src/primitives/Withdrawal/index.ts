export type { WithdrawalType } from "./WithdrawalType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromRpc } from "./fromRpc.js";

export { from, equals, fromRpc };

export const Withdrawal = {
	from,
	equals,
	fromRpc,
};
