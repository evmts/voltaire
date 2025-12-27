import { FastStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * SELFBALANCE opcode (0x47) - Get balance of currently executing account (EIP-1884, Istanbul+)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x47_SELFBALANCE(frame) {
	// Note: Add hardfork validation when Hardfork module is available
	// if (frame.evm.hardfork.isBefore(.ISTANBUL)) return { type: "InvalidOpcode" };

	const gasErr = consumeGas(frame, FastStep);
	if (gasErr) return gasErr;

	// Note: Access via Host interface when available
	// const balance = frame.evm.get_balance(frame.address);

	// Fallback: Return frame value or 0
	const balance = frame.value ?? 0n;

	const pushErr = pushStack(frame, balance);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
