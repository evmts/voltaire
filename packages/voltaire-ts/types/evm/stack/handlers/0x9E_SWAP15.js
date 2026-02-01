import { FastestStep } from "../../../primitives/GasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";
/**
 * SWAP15 opcode (0x9E) - Swap top with (15+1)th item
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x9E_SWAP15(frame) {
    const gasErr = consumeGas(frame, FastestStep);
    if (gasErr)
        return gasErr;
    if (frame.stack.length <= 15) {
        return { type: "StackUnderflow" };
    }
    const topIdx = frame.stack.length - 1;
    const swapIdx = frame.stack.length - 1 - 15;
    const temp = /** @type {bigint} */ (frame.stack[topIdx]);
    frame.stack[topIdx] = /** @type {bigint} */ (frame.stack[swapIdx]);
    frame.stack[swapIdx] = temp;
    frame.pc += 1;
    return null;
}
