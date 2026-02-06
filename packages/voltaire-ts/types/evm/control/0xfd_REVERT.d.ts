/**
 * REVERT opcode (0xfd) - Halt execution and revert state changes
 *
 * Note: REVERT was introduced in Byzantium hardfork (EIP-140).
 * Hardfork validation should be handled by the EVM executor.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0xfd_REVERT(frame: import("../Frame/FrameType.js").BrandedFrame): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xfd_REVERT.d.ts.map