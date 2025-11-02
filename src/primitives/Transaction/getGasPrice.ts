import { isLegacy, isEIP2930, isEIP1559, isEIP4844, isEIP7702 } from "./typeGuards.js";
import type { Any } from "./types.js";
import * as EIP1559 from "./EIP1559/getEffectiveGasPrice.js";
import * as EIP4844 from "./EIP4844/getEffectiveGasPrice.js";
import * as EIP7702 from "./EIP7702/getEffectiveGasPrice.js";

/**
 * Get transaction gas price (handles different types)
 */
export function getGasPrice(this: Any, baseFee?: bigint): bigint {
	if (isLegacy(this) || isEIP2930(this)) {
		return this.gasPrice;
	}

	if (!baseFee) {
		throw new Error("baseFee required for EIP-1559+ transactions");
	}

	if (isEIP1559(this)) {
		return EIP1559.getEffectiveGasPrice.call(this, baseFee);
	}

	if (isEIP4844(this)) {
		return EIP4844.getEffectiveGasPrice.call(this, baseFee);
	}

	if (isEIP7702(this)) {
		return EIP7702.getEffectiveGasPrice.call(this, baseFee);
	}

	throw new Error(`Unknown transaction type: ${(this as any).type}`);
}
