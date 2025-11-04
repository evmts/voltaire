import type { Hash } from "../Hash/index.js";
import * as EIP1559 from "./EIP1559/hash.js";
import * as EIP2930 from "./EIP2930/hash.js";
import * as EIP4844 from "./EIP4844/hash.js";
import * as EIP7702 from "./EIP7702/hash.js";
import * as Legacy from "./Legacy/hash.js";
import { type Any, Type } from "./types.js";

/**
 * Compute transaction hash
 */
export function hash(this: Any): Hash {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.hash.call(this);
		case Type.EIP2930:
			return EIP2930.hash.call(this);
		case Type.EIP1559:
			return EIP1559.hash.call(this);
		case Type.EIP4844:
			return EIP4844.hash.call(this);
		case Type.EIP7702:
			return EIP7702.hash.call(this);
		default:
			throw new Error(`Unknown transaction type: ${(this as any).type}`);
	}
}
