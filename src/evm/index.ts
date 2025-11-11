/**
 * EVM (Ethereum Virtual Machine) module
 *
 * Provides execution frame, host interface, and complete opcode handler implementations.
 * Based on guillotine-mini architecture with TypeScript/Zig dual implementation.
 *
 * @module evm
 */

// Core execution components
export * as Frame from "./Frame/index.js";
export * as Host from "./Host/index.js";

// Re-export types
export type { BrandedFrame, EvmError } from "./Frame/BrandedFrame.js";
export type { BrandedHost } from "./Host/BrandedHost.js";

// Arithmetic opcodes (0x01-0x0b)
export * as Arithmetic from "./arithmetic/index.js";

// Comparison opcodes (0x10-0x15)
export * as Comparison from "./comparison/index.js";

// Bitwise opcodes (0x16-0x1d)
export * as Bitwise from "./bitwise/index.js";

// Keccak opcode (0x20)
export * as Keccak from "./keccak/index.js";

// Context opcodes (0x30-0x3f)
export * as Context from "./context/index.js";

// Block opcodes (0x40-0x4a)
export * as Block from "./block/index.js";

// Stack opcodes (0x50, 0x5f-0x9f)
export * as Stack from "./stack/handlers/index.js";

// Memory opcodes (0x51-0x53, 0x5e)
export * as Memory from "./memory/index.js";

// Storage opcodes (0x54-0x55, 0x5c-0x5d)
export * as Storage from "./storage/handlers/index.js";

// Control flow opcodes (0x00, 0x56-0x58, 0x5b, 0xf3, 0xfd)
export * as Control from "./control/index.js";

// Log opcodes (0xa0-0xa4)
export * as Log from "./log/index.js";

// System opcodes (0xf0-0xf2, 0xf4-0xf5, 0xfa, 0xff)
export * as System from "./system/index.js";
