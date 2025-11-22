/**
 * Web3 JSON-RPC Methods
 *
 * This module provides a type-safe mapping of web3 namespace methods to their types.
 * All imports are kept separate to maintain tree-shakability.
 */

// Method imports - each import is separate for tree-shaking
import * as web3_clientVersion from "./clientVersion/web3_clientVersion.js";
import * as web3_sha3 from "./sha3/web3_sha3.js";

/**
 * Method name enum - provides string literals for each method
 *
 * @typedef {(typeof Web3Method)[keyof typeof Web3Method]} Web3Method
 */
export const Web3Method = {
	web3_clientVersion: "web3_clientVersion",
	web3_sha3: "web3_sha3",
};

// Re-export individual method modules for direct access (tree-shakable)
export { web3_clientVersion, web3_sha3 };

// ============================================================================
// Request Constructors - Branded Request Types
// ============================================================================

/**
 * Request constructor functions for type-safe JSON-RPC requests
 */
export const ClientVersionRequest = web3_clientVersion.ClientVersionRequest;
export const Sha3Request = web3_sha3.Sha3Request;
