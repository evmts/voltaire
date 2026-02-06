import type { brand } from "../../brand.js";

/**
 * Branded ProtocolVersion type - Ethereum protocol version identifier
 * Wraps a string representing a protocol version (e.g., "eth/67", "eth/68")
 *
 * Protocol versions identify the version of the Ethereum wire protocol
 * used for peer-to-peer communication:
 * - "eth/66" = ETH66 protocol
 * - "eth/67" = ETH67 protocol (current standard)
 * - "eth/68" = ETH68 protocol
 * - "snap/1" = Snapshot protocol
 */
export type ProtocolVersionType = string & {
	readonly [brand]: "ProtocolVersion";
};
