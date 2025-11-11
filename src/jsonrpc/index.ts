/**
 * JSON-RPC - Ethereum JSON-RPC Type System
 *
 * Type-safe Ethereum JSON-RPC method definitions generated from the official OpenRPC specification.
 * Provides complete type coverage for eth, debug, and engine namespaces.
 *
 * @module jsonrpc
 */

// Re-export all JSON-RPC types and methods
export * from './JsonRpc.js';

// Export namespace-specific methods for tree-shakable imports
export * as eth from './eth/methods.js';
export * as debug from './debug/methods.js';
export * as engine from './engine/methods.js';

// Export shared types
export * as types from './types/index.js';
