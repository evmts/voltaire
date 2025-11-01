import type { Hash } from "../Hash/index.js";
import { Type, type Any } from "./types.js";
import * as Legacy from "./Legacy/getSigningHash.js";
import * as EIP2930 from "./EIP2930/getSigningHash.js";
import * as EIP1559 from "./EIP1559/getSigningHash.js";
import * as EIP4844 from "./EIP4844/getSigningHash.js";
import * as EIP7702 from "./EIP7702/getSigningHash.js";

/**
 * Get signing hash for transaction
 */
export function getSigningHash(tx: Any): Hash {
	switch (tx.type) {
		case Type.Legacy:
			return Legacy.getSigningHash.call(tx);
		case Type.EIP2930:
			return EIP2930.getSigningHash.call(tx);
		case Type.EIP1559:
			return EIP1559.getSigningHash.call(tx);
		case Type.EIP4844:
			return EIP4844.getSigningHash.call(tx);
		case Type.EIP7702:
			return EIP7702.getSigningHash.call(tx);
		default:
			throw new Error(`Unknown transaction type: ${(tx as any).type}`);
	}
}
