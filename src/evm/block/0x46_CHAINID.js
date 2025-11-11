import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import { QuickStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * CHAINID opcode (0x46) - Get chain ID (EIP-1344, Istanbul+)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x46_CHAINID(frame) {
	// TODO: Check hardfork when available
	// if (frame.evm.hardfork.isBefore(.ISTANBUL)) return { type: "InvalidOpcode" };

	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Access via block context when available
	// const chainId = frame.evm.block_context.chain_id;

	// Stub: Use frame property or default (1 = Ethereum mainnet)
	const chainId = frame.chainId ?? 1n;

	const pushErr = pushStack(frame, chainId);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
