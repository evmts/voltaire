import { ExtStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * BLOCKHASH opcode (0x40) - Get hash of recent block
 *
 * Per Python reference (cancun/vm/instructions/block.py:21-64):
 * - Charges GAS_BLOCK_HASH (20 gas)
 * - Returns hash of one of the 256 most recent complete blocks
 * - Returns 0 if block number is out of range (too old or >= current)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x40_BLOCKHASH(frame) {
	const gasErr = consumeGas(frame, ExtStep);
	if (gasErr) return gasErr;

	const { value: blockNumber, error: popErr } = popStack(frame);
	if (popErr) return popErr;

	// Per Python reference:
	// Return 0 if:
	// 1. Requested block >= current block
	// 2. Requested block is more than 256 blocks old
	let hashValue = 0n;

	const currentBlock = frame.blockNumber ?? 0n;
	const blockHashes = frame.blockHashes;

	if (
		blockHashes &&
		blockNumber < currentBlock &&
		blockNumber >= currentBlock - 256n
	) {
		hashValue = blockHashes.get(blockNumber) ?? 0n;
	}

	const pushErr = pushStack(frame, hashValue);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
