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
export * from './address.js';
export * from './hash.js';
export * from './hex.js';

// Numeric types
export * from './uint.js';

// Encoding
export * from './rlp.js';
export * from './abi.js';

// Transactions
export * from './transaction.js';
export * from './access-list.js';
export * from './authorization.js';

// EVM
export * from './bytecode.js';
export * from './opcode.js';
export * from './gas-constants.js';

// Protocol
export * from './blob.js';
export * from './fee-market.js';
export * from './hardfork.js';

// Events & Logs
export * from './event-log.js';

// Sign-in with Ethereum
export * from './siwe.js';
