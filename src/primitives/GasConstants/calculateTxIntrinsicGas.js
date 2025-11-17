import {
	Tx,
	TxContractCreation,
	TxDataNonZero,
	TxDataZero,
} from "./constants.js";

/**
 * Calculate transaction intrinsic gas cost
 *
 * @param {Uint8Array} data - Transaction calldata
 * @param {boolean} isCreate - Whether transaction creates a contract
 * @returns {bigint} Intrinsic gas cost
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([0, 1, 2, 0, 0]);
 * const cost = calculateTxIntrinsicGas(data, false);
 * // 21000 + (3 * 4) + (2 * 16) = 21044 gas
 * ```
 */
export function calculateTxIntrinsicGas(data, isCreate) {
	const base = isCreate ? TxContractCreation : Tx;
	let dataCost = 0n;

	for (let i = 0; i < data.length; i++) {
		dataCost += data[i] === 0 ? TxDataZero : TxDataNonZero;
	}

	return base + dataCost;
}
