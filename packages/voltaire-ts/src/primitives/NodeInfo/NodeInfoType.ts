import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { NetworkIdType } from "../NetworkId/NetworkIdType.js";
import type { PeerIdType } from "../PeerId/PeerIdType.js";
import type { BrandedUint } from "../Uint/Uint256Type.js";

/**
 * Node information structure from admin_nodeInfo RPC method
 *
 * Contains metadata about the local Ethereum node including:
 * - Network identity (enode, ID, IP)
 * - Protocol information
 * - Chain state (genesis, head, difficulty)
 * - Listening ports
 *
 * @see https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-admin#admin-nodeinfo
 */
export type NodeInfoType = {
	/** Enode URL of the node */
	readonly enode: PeerIdType;
	/** Node ID (hex-encoded public key) */
	readonly id: string;
	/** External IP address */
	readonly ip: string;
	/** Listen address (IP:PORT) */
	readonly listenAddr: string;
	/** Client identifier (e.g., "Geth/v1.10.26-stable/linux-amd64/go1.19.5") */
	readonly name: string;
	/** Network ports */
	readonly ports: {
		/** UDP discovery port */
		readonly discovery: number;
		/** TCP listener port */
		readonly listener: number;
	};
	/** Protocol-specific information */
	readonly protocols: {
		/** Ethereum protocol info (if supported) */
		readonly eth?: {
			/** Network ID */
			readonly network: NetworkIdType;
			/** Total difficulty of the chain */
			readonly difficulty: BrandedUint;
			/** Genesis block hash */
			readonly genesis: BlockHashType;
			/** Current head block hash */
			readonly head: BlockHashType;
			/** Chain configuration */
			readonly config: Record<string, unknown>;
		};
		/** Other protocols (snap, les, etc.) */
		readonly [protocol: string]: unknown;
	};
};
