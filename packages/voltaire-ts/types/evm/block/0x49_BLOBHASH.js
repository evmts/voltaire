import { FastestStep } from "../../primitives/GasConstants/constants.js";
import { CANCUN, isAtLeast } from "../../primitives/Hardfork/index.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
/**
 * BLOBHASH opcode (0x49) - Get versioned blob hash (EIP-4844, Cancun+)
 *
 * Per Python reference (cancun/vm/gas.py:68):
 * - GAS_BLOBHASH_OPCODE = 3 (same as GasFastestStep)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x49_BLOBHASH(frame) {
    if (frame.hardfork && !isAtLeast(frame.hardfork, CANCUN)) {
        return { type: "InvalidOpcode" };
    }
    const gasErr = consumeGas(frame, FastestStep);
    if (gasErr)
        return gasErr;
    const { value: index, error: popErr } = popStack(frame);
    if (popErr)
        return popErr;
    // Return the blob versioned hash at the given index, or 0 if out of bounds
    let hashValue = 0n;
    const blobHashes = frame.blobVersionedHashes;
    if (blobHashes && index < BigInt(blobHashes.length)) {
        hashValue = blobHashes[Number(index)] ?? 0n;
    }
    const pushErr = pushStack(frame, hashValue);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
