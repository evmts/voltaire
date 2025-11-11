import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * GASPRICE opcode (0x3a) - Get price of gas in current environment
 *
 * Stack: [] => [gasPrice]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {bigint} gasPrice - Transaction gas price
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function gasprice(frame, gasPrice) {
	const gasErr = consumeGas(frame, 2n);
	if (gasErr) return gasErr;

	const pushErr = pushStack(frame, gasPrice);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
