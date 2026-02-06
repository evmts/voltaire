/**
 * CALL opcode (0xf1) - Message call into an account
 *
 * Stack: [gas, address, value, inOffset, inLength, outOffset, outLength] => [success]
 * Gas: Complex (base + memory + cold access + value transfer + new account)
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
export function call(frame: import("../Frame/FrameType.js").BrandedFrame, host?: import("../Host/HostType.js").BrandedHost): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xf1_CALL.d.ts.map