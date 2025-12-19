// Export type
export type { BlockBodyType } from "./BlockBodyType.js";

// Import internal functions
import { from as _from } from "./from.js";

// Export internal functions (tree-shakeable)
export { _from };

// Type imports for function parameters
type AnyTransaction = import("../Transaction/types.js").Any;
type UncleType = import("../Uncle/UncleType.js").UncleType;
type WithdrawalType = import("../Withdrawal/WithdrawalType.js").WithdrawalType;

// Export public functions
export function from(params: {
	transactions: readonly AnyTransaction[];
	ommers: readonly UncleType[];
	withdrawals?: readonly WithdrawalType[];
}) {
	return _from(params);
}

// Namespace export
export const BlockBody = {
	from,
};
