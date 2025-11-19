import type { brand } from "../../brand.js";

/**
 * Branded PeerId type - Ethereum peer identifier
 * Wraps a string representing a peer ID (typically an enode URL)
 *
 * Enode URL format: enode://PUBKEY@IP:PORT?discport=DISCPORT
 * - PUBKEY: 128 hex character node ID (secp256k1 public key)
 * - IP: IPv4 or IPv6 address
 * - PORT: TCP port for RLPx connection
 * - DISCPORT: (optional) UDP port for peer discovery
 *
 * @example
 * ```typescript
 * const peerId = "enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@10.3.58.6:30303?discport=30301"
 * ```
 */
export type PeerIdType = string & { readonly [brand]: "PeerId" };

/**
 * Parsed enode URL components
 */
export type EnodeComponents = {
	/** Node public key (128 hex chars) */
	readonly publicKey: string;
	/** IP address (IPv4 or IPv6) */
	readonly ip: string;
	/** TCP port for RLPx */
	readonly port: number;
	/** UDP port for discovery (optional) */
	readonly discoveryPort?: number;
};
