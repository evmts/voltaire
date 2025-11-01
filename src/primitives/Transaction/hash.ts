import type { Hash } from "../Hash/index.js";
import { Type, type Any } from "./types.js";
import * as Legacy from "./Legacy/hash.js";
import * as EIP2930 from "./EIP2930/hash.js";
import * as EIP1559 from "./EIP1559/hash.js";
import * as EIP4844 from "./EIP4844/hash.js";
import * as EIP7702 from "./EIP7702/hash.js";

/**
 * Compute transaction hash
 */
export function hash(tx: Any): Hash {
	switch (tx.type) {
		case Type.Legacy:
			return Legacy.hash.call(tx);
		case Type.EIP2930:
			return EIP2930.hash.call(tx);
		case Type.EIP1559:
			return EIP1559.hash.call(tx);
		case Type.EIP4844:
			return EIP4844.hash.call(tx);
		case Type.EIP7702:
			return EIP7702.hash.call(tx);
		default:
			throw new Error(`Unknown transaction type: ${(tx as any).type}`);
	}
}
