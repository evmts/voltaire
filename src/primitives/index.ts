/**
 * Primitives V2 - Data-first branded types for Ethereum primitives
 *
 * This module provides tree-shakeable, data-first interfaces matching the Zig API.
 * All types are branded primitives (Uint8Array, bigint, string) with methods
 * namespaced on the type itself for optimal tree-shaking.
 *
 * @example
 * ```typescript
 * import { Address } from '@tevm/primitives';
 *
 * // Create from hex
 * const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
 *
 * // Use methods
 * const checksum = Address.toChecksumHex(addr);
 * const isZero = Address.isZero(addr);
 * ```
 */

// Core primitives
export * as Address from "./Address/index.js";
export * as Hash from "./Hash/index.js";
export * as Hex from "./Hex/index.js";

// Numeric types
export * as Uint from "./Uint/index.js";

// Encoding
export * as Rlp from "./Rlp/index.js";
export * as Abi from "./Abi/index.js";

// Transactions
export * as Transaction from "./Transaction/index.js";
export * as AccessList from "./AccessList/index.js";
export * as Authorization from "./Authorization/index.js";

// EVM
export * as Bytecode from "./Bytecode/index.js";
export * as Opcode from "./Opcode/index.js";
export * as GasConstants from "./GasConstants/index.js";
export * as State from "./State/index.js";

// Protocol
export * as Blob from "./Blob/index.js";
export * as FeeMarket from "./FeeMarket/index.js";
export * as Hardfork from "./Hardfork/index.js";

// Events & Logs
export * as EventLog from "./EventLog/index.js";

// Sign-in with Ethereum
export * as Siwe from "./Siwe/index.js";
