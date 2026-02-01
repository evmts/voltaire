/**
 * EXTCODEHASH opcode (0x3f) - Get hash of an account's code
 *
 * Stack: [address] => [hash]
 *
 * Gas costs vary by hardfork (EIP-1884, EIP-2929):
 * - Constantinople-Istanbul: 400 gas
 * - Istanbul-Berlin: 700 gas (EIP-1884)
 * - Berlin+ (EIP-2929): 2600 gas (cold) / 100 gas (warm)
 *
 * EIP-1052 (Constantinople): Introduces EXTCODEHASH opcode
 * - Returns keccak256 hash of account's code
 * - Returns 0 for non-existent accounts (instead of empty hash)
 * - Can be used for code verification without deploying full code
 *
 * EIP-2929 (Berlin) tracks warm/cold access for state operations.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function extcodehash(frame: import("../Frame/FrameType.js").BrandedFrame, host: import("../Host/HostType.js").BrandedHost): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x3f_EXTCODEHASH.d.ts.map