/**
 * Ethereum JSON-RPC Type System
 *
 * This module provides the root JSON-RPC namespace that combines all method namespaces.
 * Imports are kept tree-shakable - only import what you use.
 */

export * from "./engine/methods.js";
export * from "./eth/methods.js";
export * from "./debug/methods.js";

// Export primitive types separately
export * as types from "./types/index.js";
