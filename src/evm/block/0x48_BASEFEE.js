import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import { QuickStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * BASEFEE opcode (0x48) - Get base fee per gas (EIP-3198, London+)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x48_BASEFEE(frame) {
	// TODO: Check hardfork when available
	// if (frame.evm.hardfork.isBefore(.LONDON)) return { type: "InvalidOpcode" };

	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Access via block context when available
	// const baseFee = frame.evm.block_context.block_base_fee;

	// Stub: Use frame property or default (0 for pre-London)
	const baseFee = frame.blockBaseFee ?? 0n;

	const pushErr = pushStack(frame, baseFee);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
