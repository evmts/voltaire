/**
 * Net JSON-RPC Methods
 *
 * This module provides a type-safe mapping of net namespace methods to their types.
 * All imports are kept separate to maintain tree-shakability.
 */

// Method imports - each import is separate for tree-shaking
import * as net_listening from "./listening/net_listening.js";
import * as net_peerCount from "./peerCount/net_peerCount.js";
import * as net_version from "./version/net_version.js";

/**
 * Method name enum - provides string literals for each method
 *
 * @typedef {(typeof NetMethod)[keyof typeof NetMethod]} NetMethod
 */
export const NetMethod = {
	net_listening: "net_listening",
	net_peerCount: "net_peerCount",
	net_version: "net_version",
};

// Re-export individual method modules for direct access (tree-shakable)
export { net_listening, net_peerCount, net_version };

// ============================================================================
// Request Constructors - Branded Request Types
// ============================================================================

/**
 * Request constructor functions for type-safe JSON-RPC requests
 */
export const ListeningRequest = net_listening.ListeningRequest;
export const PeerCountRequest = net_peerCount.PeerCountRequest;
export const VersionRequest = net_version.VersionRequest;
