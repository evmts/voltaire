import { InvalidRangeError } from "../errors/index.js";
import { DEFAULT } from "../Hardfork/constants.js";
import type { HardforkType } from "../Hardfork/HardforkType.js";
import { exceedsTxGasLimit, MAX_TX_GAS_LIMIT } from "./exceedsTxGasLimit.js";

const DOCS = "/primitives/transaction/validate-gas-limit#error-handling";

/**
 * Options for {@link validateGasLimit}.
 */
export type ValidateGasLimitOptions = {
	/** Hardfork the transaction executes under. Defaults to the latest stable fork. */
	hardfork?: HardforkType;
	/** Block gas limit; the transaction gas limit may not exceed it. */
	blockGasLimit?: bigint;
};

/**
 * Validate a transaction gas limit.
 *
 * - The gas limit must be positive.
 * - From Osaka (the default hardfork), it must not exceed the EIP-7825 cap of
 *   `2^24` (16,777,216) gas.
 * - If `blockGasLimit` is given, it must not exceed the block gas limit.
 *
 * @param this Transaction
 * @param options Hardfork and optional block gas limit
 * @throws {InvalidRangeError} If gas limit is non-positive or exceeds a cap
 */
export function validateGasLimit(
	this: { gasLimit: bigint },
	options: ValidateGasLimitOptions = {},
): void {
	const { hardfork = DEFAULT, blockGasLimit } = options;
	if (this.gasLimit <= 0n) {
		throw new InvalidRangeError("Gas limit must be positive", {
			code: -32602,
			value: this.gasLimit,
			expected: "Positive gas limit value",
			docsPath: DOCS,
		});
	}
	if (exceedsTxGasLimit(this, hardfork)) {
		throw new InvalidRangeError(
			`Gas limit exceeds maximum of ${MAX_TX_GAS_LIMIT} (EIP-7825, ${hardfork})`,
			{
				code: -32602,
				value: this.gasLimit,
				expected: `Gas limit <= ${MAX_TX_GAS_LIMIT}`,
				docsPath: DOCS,
			},
		);
	}
	if (blockGasLimit !== undefined && this.gasLimit > blockGasLimit) {
		throw new InvalidRangeError(
			`Gas limit exceeds maximum of ${blockGasLimit} (block gas limit)`,
			{
				code: -32602,
				value: this.gasLimit,
				expected: `Gas limit <= ${blockGasLimit}`,
				docsPath: DOCS,
			},
		);
	}
}
