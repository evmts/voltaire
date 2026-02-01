import { fromNumber } from "../../primitives/Address/fromNumber.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import { gasCostAccessAddress } from "./gasCostAccessAddress.js";
/**
 * BALANCE opcode (0x31) - Get balance of an account
 *
 * Stack: [address] => [balance]
 *
 * Gas costs vary by hardfork (EIP-150, EIP-1884, EIP-2929):
 * - Pre-Tangerine Whistle: 20 gas
 * - Tangerine Whistle (EIP-150): 400 gas
 * - Istanbul (EIP-1884): 700 gas
 * - Berlin (EIP-2929): 2600 gas (cold) / 100 gas (warm)
 *
 * EIP-2929 (Berlin) tracks warm/cold access for state operations:
 * - Cold access: First time address is accessed in transaction (2600 gas)
 * - Warm access: Subsequent accesses to same address (100 gas)
 * - Tracking maintained in frame.accessedAddresses Set
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function balance(frame, host) {
    const addrResult = popStack(frame);
    if (addrResult.error)
        return addrResult.error;
    const addrU256 = addrResult.value;
    const addr = fromNumber(addrU256);
    // Calculate hardfork-aware gas cost with warm/cold tracking
    const gasCost = gasCostAccessAddress(frame, addr);
    const gasErr = consumeGas(frame, gasCost);
    if (gasErr)
        return gasErr;
    const bal = host.getBalance(addr);
    const pushErr = pushStack(frame, bal);
    if (pushErr)
        return pushErr;
    frame.pc += 1;
    return null;
}
