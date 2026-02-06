import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { CANCUN, isAtLeast } from "../../primitives/Hardfork/index.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
/**
 * BLOBBASEFEE opcode (0x4a) - Get blob base fee (EIP-7516, Cancun+)
 *
 * Per Python reference (cancun/vm/gas.py and BlobBaseFeeGas constant):
 * - GAS_BASE = 2 (same as GasQuickStep)
 * - Returns blob_base_fee calculated from excess_blob_gas
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x4a_BLOBBASEFEE(frame) {
    if (frame.hardfork && !isAtLeast(frame.hardfork, CANCUN)) {
        return { type: "InvalidOpcode" };
    }
    const gasErr = consumeGas(frame, QuickStep);
    if (gasErr)
        return gasErr;
    // Use block context blob base fee (EIP-7516, Cancun+)
    // Defaults to 1 wei minimum per EIP-4844
    const blobBaseFee = frame.blobBaseFee ?? 1n;
    const pushErr = pushStack(frame, blobBaseFee);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
