export type {
	StateDiffType,
	AccountDiff,
	BalanceChange,
	NonceChange,
	CodeChange,
} from "./StateDiffType.js";

import { from as _from } from "./from.js";
import { getAccount as _getAccount } from "./getAccount.js";
import { getAddresses as _getAddresses } from "./getAddresses.js";
import { isEmpty as _isEmpty } from "./isEmpty.js";

// Export constructors
export { from } from "./from.js";

// Export public wrapper functions
export function getAccount(
	diff:
		| import("./StateDiffType.js").StateDiffType
		| Map<
				import("../Address/AddressType.js").AddressType,
				import("./StateDiffType.js").AccountDiff
		  >,
	address: import("../Address/AddressType.js").AddressType,
): import("./StateDiffType.js").AccountDiff | undefined {
	const d = diff instanceof Map ? _from(diff) : diff;
	return _getAccount(d, address);
}

export function getAddresses(
	diff:
		| import("./StateDiffType.js").StateDiffType
		| Map<
				import("../Address/AddressType.js").AddressType,
				import("./StateDiffType.js").AccountDiff
		  >,
): Array<import("../Address/AddressType.js").AddressType> {
	const d = diff instanceof Map ? _from(diff) : diff;
	return _getAddresses(d);
}

export function isEmpty(
	diff:
		| import("./StateDiffType.js").StateDiffType
		| Map<
				import("../Address/AddressType.js").AddressType,
				import("./StateDiffType.js").AccountDiff
		  >,
): boolean {
	const d = diff instanceof Map ? _from(diff) : diff;
	return _isEmpty(d);
}

// Export internal functions (tree-shakeable)
export { _getAccount, _getAddresses, _isEmpty };

// Namespace export
export const StateDiff = {
	from: _from,
	getAccount,
	getAddresses,
	isEmpty,
};
