export type { BrandedHost } from "./HostType.js";
import type { AddressType as Address } from "../../primitives/Address/AddressType.js";
import type { CallParams, CallResult, CreateParams, CreateResult } from "../InstructionHandlerType.js";
import { createMemoryHost as _createMemoryHost } from "./createMemoryHost.js";
import { from as _from } from "./from.js";
import type { BrandedHost } from "./HostType.js";
export { createMemoryHost as _createMemoryHost } from "./createMemoryHost.js";
export { from as _from } from "./from.js";
/**
 * Host implementation interface
 *
 * ## Architecture Note
 *
 * This module provides low-level EVM primitives. For full EVM execution use:
 * - **guillotine**: Production EVM with async state, tracing, full EIP support
 * - **guillotine-mini**: Lightweight synchronous EVM for testing
 *
 * The optional `call` and `create` methods enable nested execution. When not
 * provided, system opcodes (CALL, CREATE, etc.) return NotImplemented error.
 */
export interface HostImpl {
    getBalance: (address: Address) => bigint;
    setBalance: (address: Address, balance: bigint) => void;
    getCode: (address: Address) => Uint8Array;
    setCode: (address: Address, code: Uint8Array) => void;
    getStorage: (address: Address, slot: bigint) => bigint;
    setStorage: (address: Address, slot: bigint, value: bigint) => void;
    getNonce: (address: Address) => bigint;
    setNonce: (address: Address, nonce: bigint) => void;
    getTransientStorage?: (address: Address, slot: bigint) => bigint;
    setTransientStorage?: (address: Address, slot: bigint, value: bigint) => void;
    /** Optional: nested CALL execution. Provided by guillotine/guillotine-mini. */
    call?: (params: CallParams) => CallResult;
    /** Optional: nested CREATE execution. Provided by guillotine/guillotine-mini. */
    create?: (params: CreateParams) => CreateResult;
}
/**
 * Create a Host interface implementation
 *
 * @param impl - Host implementation with state access methods
 * @returns Host instance
 * @example
 * ```typescript
 * import { Host } from 'voltaire/evm/Host';
 *
 * const host = Host({
 *   getBalance: (addr) => balances.get(addr) ?? 0n,
 *   setBalance: (addr, bal) => balances.set(addr, bal),
 *   // ... other methods
 * });
 * ```
 */
export declare function Host(impl: HostImpl): BrandedHost;
export declare namespace Host {
    var from: typeof _from;
    var createMemoryHost: typeof _createMemoryHost;
}
export default Host;
//# sourceMappingURL=index.d.ts.map