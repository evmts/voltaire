/**
 * CREATE2 opcode (0xf5) - Create a new contract with deterministic address
 *
 * Stack: [value, offset, length, salt] => [address]
 * Gas: 32000 + memory expansion + init code hash cost + keccak256 cost
 * Address: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))
 * Note: Introduced in EIP-1014 (Constantinople)
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
export function create2(frame: import("../Frame/FrameType.js").BrandedFrame, host?: import("../Host/HostType.js").BrandedHost): import("../Frame/FrameType.js").EvmError | null;
//# sourceMappingURL=0xf5_CREATE2.d.ts.map