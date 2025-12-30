// Export type definition
export type { PeerInfoType } from "./PeerInfoType.js";

// Import all functions
import { from } from "./from.js";
import { hasCapability as _hasCapability } from "./hasCapability.js";
import { isInbound as _isInbound } from "./isInbound.js";

// Export constructors
export { from };

// Export public wrapper functions
// biome-ignore lint/suspicious/noExplicitAny: accepts any RPC response shape
export function hasCapability(peerInfo: any, capability: string): boolean {
	const peer = from(peerInfo);
	return _hasCapability.call(peer, capability);
}

// biome-ignore lint/suspicious/noExplicitAny: accepts any RPC response shape
export function isInbound(peerInfo: any): boolean {
	const peer = from(peerInfo);
	return _isInbound.call(peer);
}

// Export internal functions (tree-shakeable)
export { _hasCapability, _isInbound };

// Export as namespace (convenience)
export const PeerInfo = {
	from,
	hasCapability,
	isInbound,
};
