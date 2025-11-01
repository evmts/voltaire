import { isLegacy, isEIP2930, isEIP1559, isEIP4844, isEIP7702 } from "./typeGuards.js";
import type { Any } from "./types.js";
import * as EIP1559 from "./EIP1559/getEffectiveGasPrice.js";
import * as EIP4844 from "./EIP4844/getEffectiveGasPrice.js";
import * as EIP7702 from "./EIP7702/getEffectiveGasPrice.js";

/**
 * Get transaction gas price (handles different types)
 */
export function getGasPrice(tx: Any, baseFee?: bigint): bigint {
	if (isLegacy(tx) || isEIP2930(tx)) {
		return tx.gasPrice;
	}

	if (!baseFee) {
		throw new Error("baseFee required for EIP-1559+ transactions");
	}

	if (isEIP1559(tx)) {
		return EIP1559.getEffectiveGasPrice.call(tx, baseFee);
	}

	if (isEIP4844(tx)) {
		return EIP4844.getEffectiveGasPrice.call(tx, baseFee);
	}

	if (isEIP7702(tx)) {
		return EIP7702.getEffectiveGasPrice.call(tx, baseFee);
	}

	throw new Error(`Unknown transaction type: ${(tx as any).type}`);
}
