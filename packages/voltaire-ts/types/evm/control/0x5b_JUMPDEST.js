import { Jumpdest } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
/**
 * JUMPDEST opcode (0x5b) - Jump destination marker (no-op)
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x5b_JUMPDEST(frame) {
    const gasErr = consumeGas(frame, Jumpdest);
    if (gasErr)
        return gasErr;
    frame.pc += 1;
    return null;
}
