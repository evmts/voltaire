import { FastestStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * BLOBHASH opcode (0x49) - Get versioned blob hash (EIP-4844, Cancun+)
 *
 * Per Python reference (cancun/vm/gas.py:68):
 * - GAS_BLOBHASH_OPCODE = 3 (same as GasFastestStep)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x49_BLOBHASH(frame) {
	// TODO: Check hardfork when available
	// if (frame.evm.hardfork.isBefore(.CANCUN)) return { type: "InvalidOpcode" };

	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	const { value: index, error: popErr } = popStack(frame);
	if (popErr) return popErr;

	// TODO: Access via EVM blob hashes when available
	// const blobHashes = frame.evm.blob_versioned_hashes;

	// Return the blob hash at the given index, or 0 if out of bounds
	// Stub: Always return 0 for now
	const hashValue = 0n;

	const pushErr = pushStack(frame, hashValue);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
