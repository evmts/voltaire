import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import { ExtStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * BLOCKHASH opcode (0x40) - Get hash of recent block
 *
 * Per Python reference (cancun/vm/instructions/block.py:21-64):
 * - Charges GAS_BLOCK_HASH (20 gas)
 * - Returns hash of one of the 256 most recent complete blocks
 * - Returns 0 if block number is out of range (too old or >= current)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x40_BLOCKHASH(frame) {
	const gasErr = consumeGas(frame, ExtStep);
	if (gasErr) return gasErr;

	const { value: blockNumber, error: popErr } = popStack(frame);
	if (popErr) return popErr;

	// TODO: Access via Host interface when available
	// const currentBlock = frame.evm.block_context.block_number;
	// const blockHashes = frame.evm.block_context.block_hashes;

	// Stub: Always return 0 for now
	// Per Python reference:
	// Return 0 if:
	// 1. Requested block >= current block
	// 2. Requested block is more than 256 blocks old
	const hashValue = 0n;

	const pushErr = pushStack(frame, hashValue);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
