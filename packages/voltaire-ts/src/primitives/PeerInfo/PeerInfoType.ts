import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { PeerIdType } from "../PeerId/PeerIdType.js";
import type { ProtocolVersionType } from "../ProtocolVersion/ProtocolVersionType.js";
import type { BrandedUint } from "../Uint/Uint256Type.js";

/**
 * Peer information structure from admin_peers RPC method
 *
 * Contains metadata about a connected peer including:
 * - Peer identity (ID, name, capabilities)
 * - Network connection details (local/remote addresses, direction)
 * - Protocol-specific state (difficulty, head block)
 *
 * @see https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-admin#admin-peers
 */
export type PeerInfoType = {
	/** Peer ID (enode URL) */
	readonly id: PeerIdType;
	/** Remote client identifier (e.g., "Geth/v1.10.26-stable") */
	readonly name: string;
	/** Supported capabilities (e.g., ["eth/67", "snap/1"]) */
	readonly caps: readonly string[];
	/** Network connection information */
	readonly network: {
		/** Local endpoint (IP:PORT) */
		readonly localAddress: string;
		/** Remote endpoint (IP:PORT) */
		readonly remoteAddress: string;
		/** True if inbound connection */
		readonly inbound: boolean;
		/** True if trusted peer */
		readonly trusted: boolean;
		/** True if static node */
		readonly static: boolean;
	};
	/** Protocol-specific information */
	readonly protocols: {
		/** Ethereum protocol info (if supported) */
		readonly eth?: {
			/** Protocol version */
			readonly version: ProtocolVersionType;
			/** Total difficulty of peer's chain */
			readonly difficulty: BrandedUint;
			/** Peer's head block hash */
			readonly head: BlockHashType;
		};
		/** Other protocols */
		readonly [protocol: string]: unknown;
	};
};
