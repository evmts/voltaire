import { consumeGas } from "../../Frame/consumeGas.js";
import { pushStack } from "../../Frame/pushStack.js";
import { QuickStep } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * PUSH0 opcode (0x5f) - Push 0 onto stack
 * EIP-3855: Introduced in Shanghai hardfork
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x5f_PUSH0(frame) {
	// TODO: Add hardfork check when Hardfork module is available
	// if (evm.hardfork.isBefore(.SHANGHAI)) {
	//   return { type: "InvalidOpcode" };
	// }

	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	const pushErr = pushStack(frame, 0n);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
