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
export * from './Address/index.js';
export * from './Hash/index.js';
export * from './Hex/index.js';

// Numeric types
export * from './Uint/index.js';

// Encoding
export * from './Rlp/index.js';
export * as Abi from './abi/index.js';

// Transactions
export * from './Transaction/index.js';
export * from './AccessList/index.js';
export * from './Authorization/index.js';

// EVM
export * from './Bytecode/index.js';
export * from './Opcode/index.js';
export * from './GasConstants/index.js';
export * from './State/index.js';

// Protocol
export * from './Blob/index.js';
export * from './FeeMarket/index.js';
export * from './Hardfork/index.js';

// Events & Logs
export * from './EventLog/index.js';

// Sign-in with Ethereum
export * from './Siwe/index.js';
