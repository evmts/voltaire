import { QuickStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * GASLIMIT opcode (0x45) - Get block gas limit
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x45_GASLIMIT(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Access via block context when available
	// const gasLimit = frame.evm.block_context.block_gas_limit;

	// Stub: Use frame property or default (30M gas)
	const gasLimit = frame.blockGasLimit ?? 30_000_000n;

	const pushErr = pushStack(frame, gasLimit);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
