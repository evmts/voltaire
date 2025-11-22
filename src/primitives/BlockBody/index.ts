// Export type
export type { BlockBodyType } from "./BlockBodyType.js";

// Import internal functions
import { from as _from } from "./from.js";

// Export internal functions (tree-shakeable)
export { _from };

// Export public functions
export function from(params: {
	transactions: readonly import("../Transaction/types.js").Any[];
	ommers: readonly import("../Uncle/UncleType.js").UncleType[];
	withdrawals?: readonly import(
		"../Withdrawal/WithdrawalType.js",
	).WithdrawalType[];
}) {
	return _from(params);
}

// Namespace export
export const BlockBody = {
	from,
};
