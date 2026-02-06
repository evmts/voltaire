/**
 * EVM (Ethereum Virtual Machine) module
 *
 * Provides execution frame, host interface, and complete opcode handler implementations.
 * Based on guillotine-mini architecture with TypeScript/Zig dual implementation.
 *
 * @module evm
 */
export * as Arithmetic from "./arithmetic/index.js";
export * as Bitwise from "./bitwise/index.js";
export * as Block from "./block/index.js";
export * as Comparison from "./comparison/index.js";
export * as Context from "./context/index.js";
export * as Control from "./control/index.js";
export type { BrandedFrame, EvmError } from "./Frame/FrameType.js";
export { Frame } from "./Frame/index.js";
export type { BrandedHost } from "./Host/HostType.js";
export { Host } from "./Host/index.js";
export type { CallParams, CallResult, CallType, CreateParams, CreateResult, InstructionHandler, } from "./InstructionHandlerType.js";
export * as Keccak from "./keccak/index.js";
export * as Log from "./log/index.js";
export * as Memory from "./memory/index.js";
export * as Precompiles from "./precompiles/precompiles.js";
export * as Stack from "./stack/handlers/index.js";
export * as Storage from "./storage/handlers/index.js";
export * as System from "./system/index.js";
//# sourceMappingURL=index.d.ts.map