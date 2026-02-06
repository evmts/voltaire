/**
 * EXTCODECOPY opcode (0x3c) - Copy an account's code to memory
 *
 * Stack: [address, destOffset, offset, size] => []
 *
 * Gas costs include three components:
 * 1. Access cost: hardfork-dependent (EIP-150, EIP-1884, EIP-2929)
 * 2. Copy cost: 3 gas per 32-byte word (rounded up)
 * 3. Memory expansion cost: Quadratic expansion cost for new memory
 *
 * Gas varies by hardfork:
 * - Pre-Tangerine Whistle: 20 gas access
 * - Tangerine Whistle (EIP-150): 700 gas access
 * - Istanbul (EIP-1884): 700 gas access
 * - Berlin (EIP-2929): 2600 gas (cold) / 100 gas (warm) access
 *
 * EIP-2929 (Berlin) tracks warm/cold access for state operations.
 * Copies size bytes from code[offset:offset+size] to memory[destOffset:].
 * Missing bytes (beyond code length) are zero-padded.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function extcodecopy(frame: import("../Frame/FrameType.js").BrandedFrame, host: import("../Host/HostType.js").BrandedHost): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0x3c_EXTCODECOPY.d.ts.map