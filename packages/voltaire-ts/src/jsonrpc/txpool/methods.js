/**
 * Txpool JSON-RPC Methods
 *
 * This module provides a type-safe mapping of txpool namespace methods to their types.
 * All imports are kept separate to maintain tree-shakability.
 */

// Method imports - each import is separate for tree-shaking
import * as txpool_content from "./content/txpool_content.js";
import * as txpool_inspect from "./inspect/txpool_inspect.js";
import * as txpool_status from "./status/txpool_status.js";

/**
 * Method name enum - provides string literals for each method
 *
 * @typedef {(typeof TxpoolMethod)[keyof typeof TxpoolMethod]} TxpoolMethod
 */
export const TxpoolMethod = {
	txpool_content: "txpool_content",
	txpool_inspect: "txpool_inspect",
	txpool_status: "txpool_status",
};

// Re-export individual method modules for direct access (tree-shakable)
export { txpool_content, txpool_inspect, txpool_status };

// ============================================================================
// Request Constructors - Branded Request Types
// ============================================================================

/**
 * Request constructor functions for type-safe JSON-RPC requests
 */
export const ContentRequest = txpool_content.ContentRequest;
export const InspectRequest = txpool_inspect.InspectRequest;
export const StatusRequest = txpool_status.StatusRequest;
