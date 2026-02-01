/**
 * EXTCODESIZE opcode (0x3b) - Get size of an account's code
 *
 * Stack: [address] => [codeSize]
 *
 * Gas costs vary by hardfork (EIP-150, EIP-1884, EIP-2929):
 * - Pre-Tangerine Whistle: 20 gas
 * - Tangerine Whistle (EIP-150): 700 gas
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
export function extcodesize(frame: import("../Frame/FrameType.js").BrandedFrame, host: import("../Host/HostType.js").BrandedHost): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x3b_EXTCODESIZE.d.ts.map