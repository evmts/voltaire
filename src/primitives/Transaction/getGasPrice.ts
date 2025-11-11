import * as EIP1559 from "./EIP1559/getEffectiveGasPrice.js";
import * as EIP4844 from "./EIP4844/getEffectiveGasPrice.js";
import * as EIP7702 from "./EIP7702/getEffectiveGasPrice.js";
import {
	isEIP1559,
	isEIP2930,
	isEIP4844,
	isEIP7702,
	isLegacy,
} from "./typeGuards.js";
import type { Any } from "./types.js";

/**
 * Get transaction gas price (handles different types).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param baseFee - Optional base fee for EIP-1559 transactions
 * @returns Gas price
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getGasPrice } from './primitives/Transaction/getGasPrice.js';
 * const gasPrice = getGasPrice.call(tx, 20n);
 * ```
 */
export function getGasPrice(this: Any, baseFee?: bigint): bigint {
	if (isLegacy(this) || isEIP2930(this)) {
		return this.gasPrice;
	}

	if (!baseFee) {
		throw new Error("baseFee required for EIP-1559+ transactions");
	}

	if (isEIP1559(this)) {
		return EIP1559.getEffectiveGasPrice(this as any, baseFee);
	}

	if (isEIP4844(this)) {
		return EIP4844.getEffectiveGasPrice(this as any, baseFee);
	}

	if (isEIP7702(this)) {
		return EIP7702.getEffectiveGasPrice(this as any, baseFee);
	}

	throw new Error(`Unknown transaction type: ${(this as any).type}`);
}
