/**
 * CREATE opcode (0xf0) - Create a new contract
 *
 * Stack: [value, offset, length] => [address]
 * Gas: 32000 + memory expansion + init code hash cost
 *
 * ## Architecture Note
 *
 * This is a low-level opcode handler. For full nested execution, the host must
 * provide a `create` method. Full EVM implementations are in:
 * - **guillotine**: Production EVM with async state, tracing, full EIP support
 * - **guillotine-mini**: Lightweight synchronous EVM for testing
 *
 * When host.create is not provided, returns NotImplemented error.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} [host] - Host interface (optional)
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function create(frame: import("../Frame/FrameType.js").BrandedFrame, host?: import("../Host/HostType.js").BrandedHost): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xf0_CREATE.d.ts.map