import {
	InvalidRangeError,
	InvalidTransactionTypeError,
} from "../errors/index.js";
import * as EIP1559 from "./EIP1559/getEffectiveGasPrice.js";
import type { TransactionEIP1559Type } from "./EIP1559/TransactionEIP1559Type.js";
import * as EIP4844 from "./EIP4844/getEffectiveGasPrice.js";
import type { TransactionEIP4844Type } from "./EIP4844/TransactionEIP4844Type.js";
import * as EIP7702 from "./EIP7702/getEffectiveGasPrice.js";
import type { TransactionEIP7702Type } from "./EIP7702/TransactionEIP7702Type.js";
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
 * @throws {InvalidRangeError} If baseFee is missing for EIP-1559+ transactions
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
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
		throw new InvalidRangeError("baseFee required for EIP-1559+ transactions", {
			code: -32602,
			value: baseFee,
			expected: "Non-null baseFee value for EIP-1559+ transaction",
			docsPath: "/primitives/transaction/get-gas-price#error-handling",
		});
	}

	if (isEIP1559(this)) {
		return EIP1559.getEffectiveGasPrice(
			this as unknown as TransactionEIP1559Type,
			baseFee,
		);
	}

	if (isEIP4844(this)) {
		return EIP4844.getEffectiveGasPrice(
			this as unknown as TransactionEIP4844Type,
			baseFee,
		);
	}

	if (isEIP7702(this)) {
		return EIP7702.getEffectiveGasPrice(
			this as unknown as TransactionEIP7702Type,
			baseFee,
		);
	}

	const unknownType = (this as { type?: unknown }).type;
	throw new InvalidTransactionTypeError(
		`Unknown transaction type: ${String(unknownType)}`,
		{
			code: -32602,
			context: { type: unknownType },
			docsPath: "/primitives/transaction/get-gas-price#error-handling",
		},
	);
}
