/**
 * STATICCALL opcode (0xfa) - Static message call (no state modifications allowed)
 *
 * Stack: [gas, address, inOffset, inLength, outOffset, outLength] => [success]
 * Gas: Similar to CALL but no value parameter
 * Note: Introduced in EIP-214 (Byzantium)
 * Note: Sets isStatic flag, preventing any state modifications in called context
 *
 * ## Architecture Note
 *
 * This is a low-level opcode handler. For full nested execution, the host must
 * provide a `call` method. Full EVM implementations are in:
 * - **guillotine**: Production EVM with async state, tracing, full EIP support
 * - **guillotine-mini**: Lightweight synchronous EVM for testing
 *
 * When host.call is not provided, returns NotImplemented error.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} [host] - Host interface (optional)
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function staticcall(frame: import("../Frame/FrameType.js").BrandedFrame, host?: import("../Host/HostType.js").BrandedHost): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xfa_STATICCALL.d.ts.map